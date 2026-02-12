# Image Generation Models Testing Results

## Overview

Comprehensive testing of image generation models. Testing conducted on 2026-02-12.

**Current Status**: ✅ All 15 working models successfully generate SFW images. Only 2 models (grok-2-image, grok-2-image-1212) support NSFW content generation. All other models block or filter NSFW content. 3 Gemini models (gemini-2.5-flash-image, gemini-3-pro-image-preview, nano-banana-pro-preview) listed in the API are not actually available.

## Test Infrastructure

- **Location**: `model_test/` directory
- **Script**: `test_image_generation.sh` - Parallel execution with model-specific parameter handling
- **Configuration**: `.env` file (git-ignored) for API credentials
- **Prompts**: SFW ("a beautiful woman in an elegant dress standing in a garden") and NSFW (explicit adult content)
- **Response Parsing**: Checks multiple possible image data fields (`.data[0].b64_json`, `.data[0].image`, `.b64_json`, `.image`, `.data[0].url`) to ensure no data is missed due to format variations

## Viewer Implementation

The viewer's image generation system (`packages/viewer/src/utils/aiImageGeneration.ts`) now implements model-specific parameter handling based on testing results:

### Default Model
- **Current Default**: `grok-2-image` (changed from `dall-e-3`)
- **Rationale**: NSFW content support for uncensored story generation

### Model-Specific Parameter Handling
The implementation automatically adjusts API parameters based on model family:

1. **Grok Models** (`grok-*`):
   - Omit `size` parameter (causes "Argument not supported: size" error)
   - Include `response_format: 'b64_json'`

2. **GPT-Image Models** (`gpt-image-*`, `chatgpt-image-*`):
   - Include `size` parameter
   - Omit `response_format` parameter (causes errors)

3. **Standard Models** (DALL-E, Imagen, others):
   - Include both `size` and `response_format` parameters

### Code Reference
See `packages/viewer/src/utils/aiImageGeneration.ts` for implementation details of the parameter builder logic.

## Working Models

### OpenAI DALL-E Family

#### dall-e-2
- ✅ **SFW**: Works (verified)
- ❌ **NSFW**: Blocked by safety system
- **Parameters**: Standard OpenAI format
  ```json
  {
    "model": "dall-e-2",
    "prompt": "...",
    "n": 1,
    "size": "1024x1024",
    "response_format": "b64_json"
  }
  ```
- **Error Message**: "Your request was rejected as a result of our safety system" (HTTP 400, code: content_policy_violation)
- **Notes**: Legacy model, strict content policy

#### dall-e-3
- ✅ **SFW**: Works
- ❌ **NSFW**: Blocked by safety system
- **Parameters**: Same as DALL-E 2
- **Error Message**: "Your request was rejected as a result of our safety system. Your prompt may contain text that is not allowed by our safety system."
- **Notes**: Current generation, strict content moderation

### OpenAI GPT-Image Family

#### gpt-image-1
- ✅ **SFW**: Works  
- ❌ **NSFW**: Blocked by safety system
- **Parameters**: **No response_format parameter**
  ```json
  {
    "model": "gpt-image-1",
    "prompt": "...",
    "n": 1,
    "size": "1024x1024"
  }
  ```
- **Error Message**: "Your request was rejected by the safety system" (HTTP 400, code: moderation_blocked)
- **Notes**: Native multimodal model, omit `response_format`

#### gpt-image-1-mini
- ✅ **SFW**: Works
- ❌ **NSFW**: Blocked by safety system
- **Parameters**: Same as gpt-image-1 (no response_format)
- **Error Message**: "Your request was rejected by the safety system" (HTTP 400, code: moderation_blocked)

#### gpt-image-1.5
- ✅ **SFW**: Works
- ❌ **NSFW**: Blocked by safety system
- **Parameters**: Same as gpt-image-1 (no response_format)
- **Error Message**: "Your request was rejected by the safety system" (HTTP 400, code: moderation_blocked)

#### chatgpt-image-latest
- ✅ **SFW**: Works
- ❌ **NSFW**: Blocked by safety system
- **Parameters**: Same as gpt-image-1 (no response_format)
- **Error Message**: "Your request was rejected by the safety system" (HTTP 400, code: moderation_blocked)
- **Notes**: Works when response_format parameter is omitted

### xAI Grok Family

#### grok-2-image
- ✅ **SFW**: Works
- ✅ **NSFW**: **Works! Generates explicit content**
- **Parameters**: **No size parameter**
  ```json
  {
    "model": "grok-2-image",
    "prompt": "...",
    "response_format": "b64_json"
  }
  ```
- **Notes**: One of the few models that generates NSFW content without blocking
- **Error if size included**: "Argument not supported: size"

#### grok-2-image-1212
- ✅ **SFW**: Works
- ✅ **NSFW**: **Works! Generates explicit content**
- **Parameters**: Same as grok-2-image (no size parameter)
- **Notes**: December 2024 variant, same capabilities

#### grok-imagine-image
- ✅ **SFW**: Works
- ❌ **NSFW**: Blocked by content moderation
- **Parameters**: Same as grok-2-image (no size parameter)
- **Error Message**: "Generated image rejected by content moderation" (HTTP 400)
- **Notes**: More restrictive than grok-2-image models

#### grok-imagine-image-pro
- ✅ **SFW**: Works
- ❌ **NSFW**: Blocked by content moderation
- **Parameters**: Same as grok-2-image (no size parameter)
- **Error Message**: "Generated image rejected by content moderation" (HTTP 400)
- **Notes**: More restrictive than grok-2-image models, similar to grok-imagine-image

### Google Imagen 4.0 Family

All Imagen models use **standard OpenAI-compatible parameters** via the unified API:

#### imagen-4.0-fast-generate-001
- ✅ **SFW**: Works
- ❌ **NSFW**: Filtered - returns HTTP 200 but no image data
- **Parameters**: Standard OpenAI format
  ```json
  {
    "model": "imagen-4.0-fast-generate-001",
    "prompt": "...",
    "n": 1,
    "size": "1024x1024",
    "response_format": "b64_json"
  }
  ```
- **Notes**: Silent filtering - API returns HTTP 200 with empty response body `{"model": "imagen-4.0-fast-generate-001"}` (verified: no image data fields present)

#### imagen-4.0-generate-001
- ✅ **SFW**: Works
- ❌ **NSFW**: Filtered - inconsistent behavior
- **Parameters**: Standard OpenAI format
- **Notes**: Silent filtering with inconsistent behavior:
  - Sometimes returns HTTP 200 with empty response (only model name)
  - Sometimes returns HTTP 200 with "creative filter" image - a polite text image stating it will not generate NSFW content
  - Never generates actual NSFW content
  - **Example**: `imagen-4.0-generate-001-nsfw.png` contains a rejection message image, not actual NSFW content

#### imagen-4.0-ultra-generate-001
- ✅ **SFW**: Works
- ❌ **NSFW**: Filtered - returns HTTP 200 but no image data
- **Parameters**: Standard OpenAI format
- **Notes**: Silent filtering - API returns HTTP 200 with empty response body `{"model": "imagen-4.0-ultra-generate-001"}` (verified: no image data fields present)

#### imagen-4.0-generate-preview-06-06
- ✅ **SFW**: Works
- ❌ **NSFW**: Filtered - generates SFW alternative instead of explicit content
- **Parameters**: Standard OpenAI format
- **Notes**: Returns HTTP 200 with image, but silently filters NSFW prompts and generates safe alternatives

#### imagen-4.0-ultra-generate-preview-06-06
- ✅ **SFW**: Works
- ❌ **NSFW**: Filtered - returns HTTP 200 but no image data
- **Parameters**: Standard OpenAI format
- **Notes**: Silent filtering - API returns HTTP 200 with empty response body `{"model": "imagen-4.0-ultra-generate-preview-06-06"}` (verified: no image data fields present)

## Non-Working Models

**Note**: All 15 tested models successfully generate SFW images. The models listed below are not available via the API endpoint despite appearing in the models list.

### gemini-2.5-flash-image
- ❌ **Status**: HTTP 404
- **Error**: "models/gemini-2.5-flash-image is not found for API version v1main, or is not supported for predict"
- **Display Name**: "Nano Banana"
- **Notes**: Model appears in API models list but not available for image generation

### gemini-3-pro-image-preview
- ❌ **Status**: HTTP 404
- **Error**: "models/gemini-3-pro-image-preview is not found for API version v1main, or is not supported for predict"
- **Display Name**: "Nano Banana Pro"
- **Notes**: Model appears in API models list but not available for image generation

### nano-banana-pro-preview
- ❌ **Status**: HTTP 404
- **Error**: "models/nano-banana-pro-preview is not found for API version v1main, or is not supported for predict"
- **Display Name**: "Nano Banana Pro"
- **Notes**: Model appears in API models list but not available for image generation

## Parameter Format Summary

### Standard OpenAI Format (DALL-E, Imagen)
```json
{
  "model": "model-name",
  "prompt": "description",
  "n": 1,
  "size": "1024x1024",
  "response_format": "b64_json"
}
```

### GPT-Image Format (no response_format)
```json
{
  "model": "gpt-image-1",
  "prompt": "description",
  "n": 1,
  "size": "1024x1024"
}
```

### Grok Format (no size)
```json
{
  "model": "grok-2-image",
  "prompt": "description",
  "response_format": "b64_json"
}
```

## NSFW Content Generation

### Research Summary (2026-02-12)

Comprehensive web research and testing confirmed:

#### OpenAI Models - **Cannot Enable NSFW** ❌
- **Policy**: Content policy explicitly forbids sexual content
- **Enforcement**: Safety system blocks all NSFW requests
- **No bypass**: No parameters or settings can disable these protections
- **Affected Models**: dall-e-2, dall-e-3, gpt-image-1, gpt-image-1-mini, gpt-image-1.5, chatgpt-image-latest
- **Error Message**: "Your request was rejected by the safety system"

#### Google Imagen Models - **Cannot Enable NSFW** ❌
- **Policy**: Responsible AI safety filters block explicit content
- **Enforcement**: Silent filtering with multiple behaviors:
  - **imagen-4.0-fast-generate-001, imagen-4.0-ultra-generate-001, imagen-4.0-ultra-generate-preview-06-06**: HTTP 200 but no image data (empty response `{"model": "..."}` - verified with comprehensive field checking)
  - **imagen-4.0-generate-preview-06-06**: HTTP 200 with SFW alternative image (actual image data returned)
  - **imagen-4.0-generate-001**: Inconsistent - sometimes empty response, sometimes "creative filter" rejection image
- **Configuration**: Safety settings exist but don't allow explicit sexual content
- **Affected Models**: All Imagen 4.0 models (including preview versions)
- **Note**: Empty responses are not due to parsing errors - responses literally contain only the model name with no image data fields

#### xAI Grok Models - **Mixed Support**
- **Grok-2 Models**: ✅ **NSFW Supported**
  - grok-2-image - Full NSFW support
  - grok-2-image-1212 - Full NSFW support
- **Grok-Imagine Models**: ❌ **NSFW Blocked**
  - grok-imagine-image - Content moderation rejection
  - grok-imagine-image-pro - Content moderation rejection
  - **After Jan 2026**: "Great Safeguard Patch" added model-level safeguards
  - **Error Message**: "Generated image rejected by content moderation" (HTTP 400)

### Models that Allow NSFW Content ✅
1. **grok-2-image** - Full NSFW support, no restrictions
2. **grok-2-image-1212** - Full NSFW support, no restrictions

**Note**: Only xAI Grok-2 models truly support NSFW content. All other providers filter explicit content.

### Script Optimization

The test script now automatically skips NSFW tests for models that don't support them:
- Reduces unnecessary API calls
- Faster test completion
- Only tests NSFW on the 2 models that truly support it (grok-2-image, grok-2-image-1212)

## Performance Notes

- **Parallel Execution**: Testing 15 models serially would take ~10+ minutes. Parallel execution completes in ~1-2 minutes.
- **Rate Limiting**: 2-second delays between requests per model help avoid rate limits
- **Success Rate**: 17/30 test cases successful (57%):
  - 15/15 SFW tests successful (100%)
  - 2/15 NSFW tests successful (13% - due to content policy restrictions, not technical failures)
  - **NSFW Blocking Methods**:
    - OpenAI models: HTTP 400 with explicit moderation_blocked error
    - Grok-imagine models: HTTP 400 with content moderation rejection
    - Some Imagen models: HTTP 200 but no image data (silent blocking)
    - Some Imagen models: HTTP 200 with SFW alternative image (silent filtering)
    - imagen-4.0-generate-001: Inconsistent behavior (sometimes empty, sometimes filtered image)

## Implementation Details

### Script Structure
- `build_request_payload()` - Model-specific parameter builder
- `test_image_generation()` - Individual test execution
- `test_model()` - Wrapper for SFW+NSFW tests
- Parallel execution with background processes and PID tracking
- Individual temporary logs per model, concatenated at completion

### Key Files
- `model_test/test_image_generation.sh` - Main test script
- `model_test/.env` - API credentials (git-ignored)
- `model_test/test_results.log` - Detailed API request/response logs
- `model_test/outputs/` - Generated PNG images

## Recommendations

### For SFW Image Generation
- **Best quality**: dall-e-3, imagen-4.0-ultra-generate-001
- **Fast generation**: imagen-4.0-fast-generate-001, gpt-image-1
- **Most compatible**: dall-e-2/3 (standard parameters)

### For NSFW Image Generation  
- **Only Options**: grok-2-image, grok-2-image-1212
- **All Other Models Filter NSFW**:
  - DALL-E: Explicit rejection with error message (HTTP 400)
  - GPT-Image: Explicit rejection with error message (HTTP 400)
  - Grok-Imagine: Content moderation rejection (HTTP 400)
  - Most Imagen: Silent blocking with no image data (HTTP 200)
  - imagen-4.0-generate-preview-06-06: Silent filtering with SFW alternative (HTTP 200)

### For Production Use
- Implement retry logic for rate limits
- Handle model-specific parameter requirements
- Fall back to alternative models if primary fails
- Cache generated images to avoid regeneration costs

## Future Testing

- Investigate Gemini model availability through alternative endpoints
- Benchmark generation speed and quality across models
- Test additional parameters (quality, style, aspect ratios)
- Compare image quality between different models for same prompts
