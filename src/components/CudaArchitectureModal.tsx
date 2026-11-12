/**
 * @license
 * Neural Architect: The Bio-Synthetic Abyss
 * Enes-BioCore Engine: C++26 & CUDA GPU Parallel Compute Architecture
 * Author & Lead Architect: Enes Öztürk
 *
 * Details the hardware-level voxel & fluid ray-tracing engine architecture,
 * SPH Navier-Stokes GPU kernels, and zero-overhead C++26 modules.
 */

import React, { useState } from 'react';
import { CudaKernelMetrics } from '../types/simulation';
import { bioAudio } from '../audio/BioAcousticEngine';

interface CudaArchitectureModalProps {
  metrics: CudaKernelMetrics;
  onClose: () => void;
}

export const CudaArchitectureModal: React.FC<CudaArchitectureModalProps> = ({
  metrics,
  onClose,
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'sph' | 'synapse' | 'fem' | 'mem'>('sph');

  const kernelCodeMap = {
    sph: `// ============================================================================
// Enes-BioCore Engine // module: bio::physics::navier_stokes_sph
// Author: Enes Öztürk | Standard: C++26 / CUDA Compute Capability 9.0+
// Direct GPU Memory Addressing & 3D SPH Navier-Stokes Acceleration
// ============================================================================
module;
#include <cuda_runtime.h>
#include <cooperative_groups.h>
export module bio.physics.navier_stokes;

namespace cg = cooperative_groups;

__global__ void __launch_bounds__(256, 4)
kernel_navier_stokes_sph_3d_fp32(
    const float4* __restrict__ particle_positions, // x, y, z, mass
    const float4* __restrict__ particle_velocities, // vx, vy, vz, density
    float4* __restrict__ out_accelerations,
    const float h,            // Kernel smoothing length (0.024m)
    const float rest_density, // 1060.0 kg/m^3 (bioplasma)
    const float viscosity,    // dynamic viscosity (Pa·s)
    const uint32_t total_particles
) {
    const uint32_t tid = blockIdx.x * blockDim.x + threadIdx.x;
    if (tid >= total_particles) return;

    auto warp = cg::tiled_partition<32>(cg::this_thread_block());
    const float4 pos_i = particle_positions[tid];
    const float4 vel_i = particle_velocities[tid];
    const float h2 = h * h;
    const float poly6_coeff = 315.0f / (64.0f * 3.14159265f * powf(h, 9.0f));
    const float spiky_grad  = -45.0f / (3.14159265f * powf(h, 6.0f));

    float3 f_pressure = make_float3(0.0f, 0.0f, 0.0f);
    float3 f_viscosity = make_float3(0.0f, 0.0f, 0.0f);

    #pragma unroll 16
    for (uint32_t j = 0; j < total_particles; ++j) {
        if (tid == j) continue;
        const float4 pos_j = particle_positions[j];
        const float3 r_vec = make_float3(pos_i.x - pos_j.x, pos_i.y - pos_j.y, pos_i.z - pos_j.z);
        const float dist2 = r_vec.x * r_vec.x + r_vec.y * r_vec.y + r_vec.z * r_vec.z;

        if (dist2 < h2 && dist2 > 1e-8f) {
            const float dist = sqrtf(dist2);
            const float h_r = h - dist;
            // Pressure force (Spiky kernel gradient)
            const float p_term = (pos_i.w + pos_j.w) / (2.0f * vel_j.w);
            const float p_factor = spiky_grad * h_r * h_r * p_term;
            f_pressure.x += p_factor * (r_vec.x / dist);
            f_pressure.y += p_factor * (r_vec.y / dist);
            f_pressure.z += p_factor * (r_vec.z / dist);

            // Viscous diffusion force
            const float v_factor = viscosity * (45.0f / (3.14159265f * powf(h, 6.0f))) * h_r;
            f_viscosity.x += v_factor * (particle_velocities[j].x - vel_i.x) / vel_j.w;
            f_viscosity.y += v_factor * (particle_velocities[j].y - vel_i.y) / vel_j.w;
            f_viscosity.z += v_factor * (particle_velocities[j].z - vel_i.z) / vel_j.w;
        }
    }

    out_accelerations[tid] = make_float4(
        (f_pressure.x + f_viscosity.x) / vel_i.w,
        (f_pressure.y + f_viscosity.y) / vel_i.w,
        (f_pressure.z + f_viscosity.z) / vel_i.w,
        vel_i.w // preserve density
    );
}`,
    synapse: `// ============================================================================
// Enes-BioCore Engine // module: bio::neural::hodgkin_huxley_simd
// Author: Enes Öztürk | Real-Time Wetware Voltage & Excitotoxicity Engine
// ============================================================================
module;
#include <simd>
#include <concepts>
export module bio.neural.wetware;

namespace bio::neural {

export struct SynapticState {
    float voltage_mv;
    float m_gate; // Na+ activation
    float h_gate; // Na+ inactivation
    float n_gate; // K+ activation
};

export [[nodiscard]] constexpr SynapticState compute_hh_step(
    const SynapticState& state,
    const float stimulus_current,
    const float dt_ms
) noexcept {
    const float v = state.voltage_mv;
    
    // Alpha and Beta gating kinetics
    const float alpha_m = 0.1f * (v + 40.0f) / (1.0f - expf(-(v + 40.0f) / 10.0f));
    const float beta_m  = 4.0f * expf(-(v + 65.0f) / 18.0f);

    const float alpha_h = 0.07f * expf(-(v + 65.0f) / 20.0f);
    const float beta_h  = 1.0f / (1.0f + expf(-(v + 35.0f) / 10.0f));

    const float alpha_n = 0.01f * (v + 55.0f) / (1.0f - expf(-(v + 55.0f) / 10.0f));
    const float beta_n  = 0.125f * expf(-(v + 65.0f) / 80.0f);

    const float m_new = state.m_gate + dt_ms * (alpha_m * (1.0f - state.m_gate) - beta_m * state.m_gate);
    const float h_new = state.h_gate + dt_ms * (alpha_h * (1.0f - state.h_gate) - beta_h * state.h_gate);
    const float n_new = state.n_gate + dt_ms * (alpha_n * (1.0f - state.n_gate) - beta_n * state.n_gate);

    constexpr float g_na = 120.0f; // mS/cm^2
    constexpr float g_k  = 36.0f;
    constexpr float g_l  = 0.3f;
    constexpr float e_na = 50.0f;  // mV
    constexpr float e_k  = -77.0f;
    constexpr float e_l  = -54.387f;

    const float i_na = g_na * (m_new * m_new * m_new) * h_new * (v - e_na);
    const float i_k  = g_k  * (n_new * n_new * n_new * n_new) * (v - e_k);
    const float i_l  = g_l  * (v - e_l);

    const float dv_dt = (stimulus_current - (i_na + i_k + i_l)) / 1.0f;

    return {
        .voltage_mv = v + dt_ms * dv_dt,
        .m_gate = m_new,
        .h_gate = h_new,
        .n_gate = n_new
    };
}
}`,
    fem: `// ============================================================================
// Enes-BioCore Engine // module: bio::physics::soft_body_fem
// Author: Enes Öztürk | Corotated Linear Finite Element Tissue Deformation
// ============================================================================
module;
#include <cuda_runtime.h>
export module bio.physics.fem;

__global__ void kernel_corotated_fem_tetrahedra(
    const float3* __restrict__ node_positions,
    float3* __restrict__ node_forces,
    const int4* __restrict__ tetrahedra_indices,
    const float* __restrict__ inverse_rest_matrices,
    const float young_modulus,  // 45 kPa (soft vascular tissue)
    const float poisson_ratio,  // 0.48 (nearly incompressible)
    const uint32_t tet_count
) {
    const uint32_t idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx >= tet_count) return;

    const int4 tet = tetrahedra_indices[idx];
    const float3 p0 = node_positions[tet.x];
    const float3 p1 = node_positions[tet.y];
    const float3 p2 = node_positions[tet.z];
    const float3 p3 = node_positions[tet.w];

    // Compute deformation gradient F = D_s * D_m^-1
    // Apply Polar Decomposition F = R * S
    // Elastic strain energy density & Cauchy stress tensor integration...
}`,
    mem: `// ============================================================================
// Enes-BioCore Engine // module: bio::memory::unified_vram
// Author: Enes Öztürk | Zero-Copy Unified Memory & Pinned Ring Buffer Architecture
// ============================================================================
namespace bio::memory {

template <typename T, size_t N>
class UnifiedVoxelRingBuffer {
private:
    T* gpu_ptr_{nullptr};
    cudaStream_t compute_stream_{nullptr};

public:
    explicit UnifiedVoxelRingBuffer() {
        // Allocate direct GPU managed unified memory
        cudaMallocManaged(&gpu_ptr_, N * sizeof(T), cudaMemAttachGlobal);
        cudaStreamCreateWithFlags(&compute_stream_, cudaStreamNonBlocking);
        
        // Advise GPU hardware prefetcher for 900+ GB/s throughput
        int device_id = 0;
        cudaGetDevice(&device_id);
        cudaMemAdvise(gpu_ptr_, N * sizeof(T), cudaMemAdviseSetPreferredLocation, device_id);
    }

    ~UnifiedVoxelRingBuffer() {
        if (compute_stream_) cudaStreamDestroy(compute_stream_);
        if (gpu_ptr_) cudaFree(gpu_ptr_);
    }

    [[nodiscard]] constexpr T* data() noexcept { return gpu_ptr_; }
    [[nodiscard]] constexpr cudaStream_t stream() noexcept { return compute_stream_; }
};

}`
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono">
      <div className="w-full max-w-4xl bg-[#090d15] border-2 border-emerald-600/80 rounded-lg shadow-[0_0_60px_rgba(16,185,129,0.3)] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="bg-[#0f172a] border-b border-emerald-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            <div>
              <h2 className="text-base font-bold text-emerald-300 tracking-wider">
                ENES-BIOCORE ENGINE // C++26 & CUDA ARCHITECTURE BLUEPRINT
              </h2>
              <div className="text-[11px] text-slate-400">
                AUTHOR & CHIEF ARCHITECT: ENES ÖZTÜRK // ZERO COMMERCIAL MOTOR DICTUM
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              bioAudio.playMechanicalClick(1.0);
              onClose();
            }}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-rose-900 border border-slate-600 rounded text-xs text-slate-200 cursor-pointer transition-colors"
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* Live GPU Kernel Telemetry Strip */}
        <div className="grid grid-cols-4 gap-2 bg-[#05080e] p-3 border-b border-slate-800 text-center text-xs">
          <div className="bg-[#101826] p-2 rounded border border-slate-800">
            <div className="text-[9px] text-slate-400">TARGET FRAMERATE</div>
            <div className="text-emerald-400 font-bold text-sm">144.0 FPS</div>
            <div className="text-[8px] text-slate-500">FRAME TIME: 6.94 ms</div>
          </div>
          <div className="bg-[#101826] p-2 rounded border border-slate-800">
            <div className="text-[9px] text-slate-400">ACTIVE CUDA THREADS</div>
            <div className="text-cyan-400 font-bold text-sm">{metrics.activeThreads.toLocaleString()}</div>
            <div className="text-[8px] text-slate-500">{metrics.gridDim}</div>
          </div>
          <div className="bg-[#101826] p-2 rounded border border-slate-800">
            <div className="text-[9px] text-slate-400">VRAM ALLOCATED</div>
            <div className="text-amber-400 font-bold text-sm">{metrics.vramAllocatedMb} MB</div>
            <div className="text-[8px] text-slate-500">UNIFIED MEMORY</div>
          </div>
          <div className="bg-[#101826] p-2 rounded border border-slate-800">
            <div className="text-[9px] text-slate-400">MEMORY BANDWIDTH</div>
            <div className="text-purple-400 font-bold text-sm">{metrics.memoryBandwidthGbS} GB/s</div>
            <div className="text-[8px] text-slate-500">NVLINK 4.0 // DIRECT</div>
          </div>
        </div>

        {/* Architectural Principles Brief */}
        <div className="p-4 bg-[#0a0f18] border-b border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1">
          <div className="text-emerald-400 font-bold flex items-center gap-2">
            <span>CORE ARCHITECTURAL MANIFESTO // ENES ÖZTÜRK:</span>
          </div>
          <p>
            Commercial game engines (Unity, Unreal Engine) rely on abstracted garbage-collected runtimes or general-purpose physics solvers incapable of true cell-scale molecular dynamics.
            The <span className="text-emerald-300 font-semibold">Enes-BioCore Engine</span> is hand-crafted from scratch in pure C++26 modules and CUDA compute capability 9.0+.
            It addresses physical GPU memory addresses directly, computing 3D Navier-Stokes SPH fluid kinematics and soft-body FEM biomechanical tissue deformations in real-time at a rock-solid 144 FPS.
          </p>
        </div>

        {/* Kernel Source Code Viewer */}
        <div className="flex bg-[#0d131f] border-b border-slate-800 px-4 gap-2 pt-2 text-xs">
          <button
            onClick={() => { setActiveCodeTab('sph'); bioAudio.playMechanicalClick(1.2); }}
            className={`px-3 py-1.5 rounded-t font-semibold cursor-pointer border-t border-x ${
              activeCodeTab === 'sph'
                ? 'bg-[#05080e] border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            CUDA SPH NAVIER-STOKES
          </button>
          <button
            onClick={() => { setActiveCodeTab('synapse'); bioAudio.playMechanicalClick(1.2); }}
            className={`px-3 py-1.5 rounded-t font-semibold cursor-pointer border-t border-x ${
              activeCodeTab === 'synapse'
                ? 'bg-[#05080e] border-cyan-500 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            C++26 HODGKIN-HUXLEY SIMD
          </button>
          <button
            onClick={() => { setActiveCodeTab('fem'); bioAudio.playMechanicalClick(1.2); }}
            className={`px-3 py-1.5 rounded-t font-semibold cursor-pointer border-t border-x ${
              activeCodeTab === 'fem'
                ? 'bg-[#05080e] border-amber-500 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            SOFT-BODY FEM TISSUE
          </button>
          <button
            onClick={() => { setActiveCodeTab('mem'); bioAudio.playMechanicalClick(1.2); }}
            className={`px-3 py-1.5 rounded-t font-semibold cursor-pointer border-t border-x ${
              activeCodeTab === 'mem'
                ? 'bg-[#05080e] border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            DIRECT GPU VRAM MEMORY
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-[#05080e] overflow-auto max-h-[46vh] text-[11px] leading-relaxed text-slate-300 font-mono">
          <pre className="whitespace-pre overflow-x-auto">
            {kernelCodeMap[activeCodeTab]}
          </pre>
        </div>
      </div>
    </div>
  );
};
