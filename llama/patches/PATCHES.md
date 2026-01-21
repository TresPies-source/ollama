# Patch Notes

Notes on patches that had conflicts or could be simplified during llama.cpp updates.

## Jan 21, 2026 Update to `c301172`

All 31 patches applied cleanly to the new base commit (99 commits ahead of previous `b1377188`).

No conflicts encountered.

## Previous Update Notes (Jan 2026 to `b1377188`)

### Patches with Conflicts (resolved)

#### 0004-solar-pro.patch
- **Conflict**: `src/llama-arch.cpp` - upstream added `LLM_ARCH_MAINCODER` in same location
- **Resolution**: Keep both architectures (MAINCODER from upstream, SOLAR from patch)
- **Simplification**: Consider upstreaming Solar Pro support

#### 0009-remove-amx.patch
- **Conflict**: `ggml/src/CMakeLists.txt` - upstream restructured CPU variants significantly
- **Resolution**: Kept upstream's expanded variant list but removed sapphirerapids with AMX
- **Simplification**: Upstream now conditionalizes AMX behind `if (NOT MSVC)`, consider if full removal is still needed

#### 0015-ggml-Export-GPU-UUIDs.patch
- **Conflict**: Could not build fake ancestor due to significant file changes
- **Resolution**: Applied manually - added `id` field to props struct, UUID parsing function, etc.
- **Note**: Upstream added `device_id` for PCI bus IDs; our `id` is for GPU UUIDs (different purposes)

#### 0018-ggml-Add-batch-size-hint.patch
- **Status**: Large API change affecting 8 files
- **Conflict**: Function signature changes across multiple backends
- **Simplification**: Consider upstreaming this - it's a clean optimization

## Potential Upstream Candidates
These patches fix general issues that could benefit upstream:
- 0002-pretokenizer - graceful handling of unknown pretokenizers
- 0003-clip-unicode - Windows unicode path support
- 0004-solar-pro - Solar Pro architecture
- 0005-fix-deepseek-deseret-regex - Windows regex fix
- 0010-fix-string-arr-kv-loading - gguf array loading

## Ollama-Specific (Won't Upstream)
- 0011-ollama-debug-tensor
- 0012-add-ollama-vocab-for-grammar-support
- 0015-ggml-Export-GPU-UUIDs (custom UUID field)
- 0024-ollama-GPU-discovery-enhancements
- 0025-NVML-fallback-for-unified-memory-GPUs
- 0028-ollama-Add-memory-detection-using-DXGI-PDH
