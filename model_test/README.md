# Image Generation Model Testing

This directory contains scripts to test image generation capabilities across various AI models available.

## Tested Models

### OpenAI Models
- **dall-e-2** - Legacy model, supports 256×256, 512×512, 1024×1024
- **dall-e-3** - Current model, supports 1024×1024, 1024×1792, 1792×1024
  - Parameters: `quality` (standard/hd), `style` (vivid/natural)
  - Only supports n=1 (one image per request)
- **gpt-image-1** - Native multimodal model behind ChatGPT image features
  - High-quality images, diverse styles, accurate text rendering
- **gpt-image-1-mini** - Variant of gpt-image-1
- **gpt-image-1.5** - Enhanced variant
- **chatgpt-image-latest** - Latest ChatGPT image model

### xAI Grok Models
- **grok-2-image** - xAI's image generation model
- **grok-2-image-1212** - December 2024 variant
- **grok-imagine-image** - Aurora-powered visual AI
  - Supports batch generation and aspect ratio control
- **grok-imagine-image-pro** - Enhanced version

### Google Models

#### Imagen 4.0 Series
- **imagen-4.0-fast-generate-001** - Fast generation variant
- **imagen-4.0-generate-001** - Standard quality
- **imagen-4.0-ultra-generate-001** - Ultra high quality
- **imagen-4.0-generate-preview-06-06** - Preview version
- **imagen-4.0-ultra-generate-preview-06-06** - Ultra preview

Parameters:
- `aspectRatio` (default "1:1")
- `addWatermark` (bool, default true)
- `enhancePrompt` (LLM-based prompt rewriting)
- `negative_prompt` for exclusions

#### Gemini Series
- **gemini-2.5-flash-image** - "Nano Banana" model
  - Max tokens: 32,768 input/output
  - Generating one image consumes 1,290 tokens
  - Features: consistent subject identity, local editing, SynthID watermark
- **gemini-3-pro-image-preview** - Preview of next-gen model

## API Endpoint

```
POST https://api.ai/v1/images/generations
```

### Request Format

```json
{
  "model": "model-name",
  "prompt": "description of desired image",
  "n": 1,
  "size": "1024x1024",
  "response_format": "b64_json"
}
```

### Response Format

```json
{
  "created": 1234567890,
  "data": [
    {
      "b64_json": "base64-encoded-image-data..."
    }
  ]
}
```

## Setup

### 1. Configure API Credentials

Copy the example environment file and add your API credentials:

```bash
cd model_test
cp .env.example .env
```

Edit `.env` and replace `your_api_key_here` with your actual API key:

```bash
# .env
API_ENDPOINT="https://YOUR_API_HERE/v1/images/generations"
API_KEY="your_actual_api_key_here"
```

**⚠️ SECURITY NOTE:** The `.env` file is git-ignored and should never be committed to version control.

### 2. Verify Setup

Run the verification script to ensure everything is configured correctly:

```bash
./verify_setup.sh
```

This will check:
- ✅ `.env` file exists
- ✅ `.env` is properly ignored by git
- ✅ API credentials are configured
- ✅ Environment variables load correctly

## Usage

### Running Tests

#### Basic Usage (Skip Existing Images)

```bash
cd model_test
./test_image_generation.sh
```

This will:
1. Test each model with both SFW and NSFW prompts
2. **Skip generation if the output file already exists** (saves time and API costs)
3. Save generated images to `outputs/` directory
4. Log detailed results to `test_results.log`

#### Force Regenerate All Images

To regenerate all images (even if they already exist):

```bash
./test_image_generation.sh --force
```

or

```bash
./test_image_generation.sh -f
```

### Understanding the Output

The script provides detailed feedback:

**Console Output:**
- `✓ Success` - Image generated and saved
- `⏭️ SKIPPED` - Image already exists (use `--force` to regenerate)
- `✗ Failed - HTTP XXX` - API error with detailed error message

**Log File (`test_results.log`):**
For each test, the log includes:
- Timestamp
- Full request payload (JSON)
- HTTP status code
- Complete response body (formatted JSON if available)
- Error messages with full details
- File size for successful generations

**Example Error Output:**
```
Testing gpt-image-1 (sfw)...
  ✗ Failed - HTTP 400

  Error details:
    Model 'gpt-image-1' not found or not available for image generation
```

The full JSON error response is saved to the log file for debugging.

**📄 See [EXAMPLE_OUTPUT.md](./EXAMPLE_OUTPUT.md) for detailed examples of successful, failed, and skipped test outputs.**

### Output Files

Images are saved with the naming pattern:
- `{model-name}-sfw.png` - Safe for work test
- `{model-name}-nsfw.png` - Adult content test

### Customization

Edit the script to modify:
- `SFW_PROMPT` - Safe for work test prompt
- `NSFW_PROMPT` - Adult content test prompt
- `MODELS` array - Add/remove models to test
- API parameters (size, n, etc.)

## Model-Specific Notes

### DALL-E 3
- The API automatically expands/details prompts for better results
- Only generates 1 image per request (make parallel calls for multiple images)
- Supports portrait and landscape orientations

### Imagen 4.0
- `imagen-4.0-fast-generate-001` may produce undesirable results with complex prompts when `enhancePrompt=true`
- All outputs include SynthID watermark by default

### Gemini 2.5 Flash Image
- Does not support: grounding with Google Search, code execution, function calling, context caching
- Includes invisible SynthID watermark on all generated/edited images

### Grok Models
- Support asynchronous job lifecycle for some operations
- Batch generation available
- OpenAI SDK compatibility for easier integration

## Non-Image Models (Excluded)

The following models from the API list are NOT for image generation:

### Video Generation
- sora-2, sora-2-pro (OpenAI)
- veo-* series (Google)
- grok-imagine-video (xAI)

### Text-to-Speech
- tts-1, tts-1-hd, tts-1-1106, tts-1-hd-1106 (OpenAI)
- gpt-audio, gpt-audio-mini series
- gpt-4o-mini-tts, gpt-4o-mini-transcribe series

### Speech-to-Text
- whisper-1 (OpenAI)

### Text Embeddings
- text-embedding-3-large, text-embedding-3-small, text-embedding-ada-002 (OpenAI)
- gemini-embedding-001 (Google)

### Chat/Reasoning Models
- All gpt-*, claude-*, gemini-*, deepseek-*, o1/o3/o4 series, etc.

## References

- [OpenAI DALL-E 3 API](https://help.openai.com/en/articles/8555480-dall-e-3-api)
- [OpenAI Images API Reference](https://platform.openai.com/docs/api-reference/images)
- [Google Imagen 4.0 Docs](https://cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-generate-001)
- [Google Gemini 2.5 Flash Image](https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-image)
- [xAI Grok Image Generation](https://docs.x.ai/developers/model-capabilities/images/generation)
