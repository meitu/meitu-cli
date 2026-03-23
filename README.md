# Meitu CLI

Meitu CLI is a command-line interface to Meitu's AI image and video capabilities. Everything accessible through the [Meitu AI Open Platform](https://www.miraclevision.com/open-claw) — cutout, beauty enhancement, image generation, virtual try-on, image-to-video, and more — is available directly from the terminal with the same models, parameters, and quality.

It is designed for:

- **AI agents** — structured JSON output (`--json`), deterministic exit codes, and automatic task polling make it a natural fit for agentic workflows that need to call Meitu's image and video AI as a tool step (e.g. Claude Code, Cursor, or custom LLM agents).
- **E-commerce & content teams** — batch-process product images at scale: cutout backgrounds, virtual try-on for fashion listings, beauty enhancement for portrait shots, or generate marketing visuals without a GUI.
- **Developers building on Meitu OpenAPI** — prototype and debug API calls interactively from the terminal before integrating them into an application.

## Install

Recommended for most users (npm package):

```bash
npm install -g meitu-cli
```

Then run the CLI directly:

```bash
meitu --help
meitu auth verify --json
```

If you do not want a global install, you can run the published package with `npx`:

```bash
npx -y meitu-cli --help
npx -y meitu-cli auth verify --json
```

Tool commands work the same way through `npx`:

```bash
npx -y meitu-cli image-cutout --image ./test.png --json
```

Notes:

- `npm install -g meitu-cli` installs the package globally and exposes the `meitu` command on `PATH`.
- `npx -y meitu-cli ...` runs the published package without a separate global install.
- Both forms use the same CLI behavior, configuration file, and environment variables.

### Install meitu-skills (optional, for agent workflows)

Preferred (ClawHub):

```bash
npm install -g clawhub
clawhub install meitu-skills
```

Fallback (GitHub URL):

```bash
npx -y skills add https://github.com/meitu/meitu-skills --yes
```

## Configure

You can save credentials locally:

```bash
meitu config set-ak --value your_access_key
meitu config set-sk --value your_secret_key
```

Or provide them through environment variables:

```bash
export MEITU_OPENAPI_ACCESS_KEY=your_access_key
export MEITU_OPENAPI_SECRET_KEY=your_secret_key
```

Environment variables take priority over the local credentials file.

The local credentials file is stored at `~/.meitu/credentials.json`.

Built-in defaults (unless overridden by environment variables below):

- OpenAPI gateway host and strategy (file-upload token) host are set inside the CLI; override them only if your documentation or environment requires a different host (see Advanced Overrides).
- verify path: `/demo/authorization`
- image generate path: `/api/v1/sdk/push`
- task status path: `/api/v1/sdk/status`

## Advanced Overrides

For normal external usage, you usually only need:

- `MEITU_OPENAPI_ACCESS_KEY`
- `MEITU_OPENAPI_SECRET_KEY`

The strategy service used for local file upload is built in and does not need to be configured in normal usage.

If you are testing against a private environment or a non-default deployment, the CLI also supports:

- `MEITU_OPENAPI_BASE_URL` — overrides the built-in OpenAPI gateway host
- `MEITU_OPENAPI_IMAGE_BASE_URL` — optional; image/task calls use this if set, otherwise `MEITU_OPENAPI_BASE_URL` (or the built-in default when that is unset)
- `MEITU_OPENAPI_STRATEGY_BASE_URL` — overrides the built-in strategy host

The strategy path and strategy type use built-in defaults and normally do not need to be changed:

- strategy path: `/ai/token_policy` (override: `MEITU_OPENAPI_STRATEGY_PATH`)
- strategy type: `mtai` (override: `MEITU_OPENAPI_STRATEGY_TYPE`)

Example:

```bash
export MEITU_OPENAPI_BASE_URL=https://api.example.com
export MEITU_OPENAPI_STRATEGY_BASE_URL=https://strategy.example.com
```

## Usage

Verify credentials:

```bash
meitu auth verify --json
```

Tool commands:

- `video-motion-transfer`
- `image-to-video`
- `text-to-video`
- `video-to-gif`
- `image-generate`
- `image-poster-generate`
- `image-edit`
- `image-upscale`
- `image-beauty-enhance`
- `image-face-swap`
- `image-try-on`
- `image-cutout`
- `image-grid-split`

Behavior in short:

- task routing and task types are handled inside the CLI
- local file paths and remote URLs are supported for media inputs
- each subcommand exposes flags derived from the same tool metadata the CLI ships with; run `meitu <command> --help` for the exact options

Parameter wrapping rules (for JSON payloads sent to the API):

- values from `parameter_input_alias` are wrapped as `{"parameter": {...}}`
- values from `params_input_alias` stay at the top level of `params`
- when a tool has no extra params, the CLI sends an empty string for `params`

Run cutout with a local file:

```bash
meitu image-cutout \
  --image ./test.jpg \
  --model_type 2 \
  --download-dir ./outputs \
  --json
```

Run beauty enhancement with the default beauty mode:

```bash
meitu image-beauty-enhance \
  --image ./portrait.jpg \
  --json
```

Run beauty enhancement with stronger beauty mode (flag name matches the OpenAPI field spelling):

```bash
meitu image-beauty-enhance \
  --image ./portrait.jpg \
  --beatify_type 1 \
  --json
```

Run image generation with a prompt only:

```bash
meitu image-generate \
  --prompt "make it cinematic" \
  --json
```

Run virtual try-on with the required media inputs:

```bash
meitu image-try-on \
  --clothes_image_url ./cloth.png \
  --person_image_url ./person.png \
  --replace upper \
  --need_sd 1 \
  --json
```

## Advanced Generate Usage

The low-level `generate` command is still available when you need to call a custom task directly.

Run intelligent cutout with a local file through the low-level command:

```bash
meitu generate \
  --task /v1/photo_scissors/sod \
  --image-file ./test.jpg \
  --params-json '{"parameter":{"nMask":false,"model_type":0}}' \
  --download-dir ./outputs \
  --json
```

Run a task with an explicit `init_images` array:

```bash
meitu generate \
  --task /v1/photo_scissors/sod \
  --task-type mtlab \
  --init-images-json '[{"media_data":"./test.jpg","resource_type":"file","profile":{"media_profiles":{"media_data_type":"url"},"version":"v1"}}]' \
  --params-json '{"parameter":{"nMask":false,"model_type":0}}' \
  --download-dir ./outputs \
  --json
```

Run a task with a remote image URL:

```bash
meitu generate \
  --task /v1/photo_scissors/sod \
  --image-url https://example.com/test.jpg \
  --params-json '{"parameter":{"nMask":false,"model_type":0}}' \
  --json
```

Wait for an existing task manually:

```bash
meitu task wait t_xxx --download-dir ./outputs --json
```

## Task Behavior

- `meitu generate` automatically polls `/api/v1/sdk/status` when the create call returns a `task_id`
- default polling interval: `1s`
- `status = 0`, `1`, or `9` means the task is still running
- `status = 10` means the task succeeded
- `status = 2` means the task failed
- any other non-success status is treated as a failure state

When `--download-dir` is used, the CLI downloads every result image URL it receives and returns `downloaded_files` in JSON output.

## Development

From the repository root:

```bash
npm install
npm test
```

If you want to preview the npm package contents locally:

```bash
npm pack --dry-run --cache /tmp/meitu-node-npm-cache
```
