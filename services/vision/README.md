# SlotForge Vision

Camera service for finish-line timing and an overhead view. Scaffold for now.
The design matters more than the code at this stage.

## What it should do

- Watch a finish-line region per lane and emit a `lap` event when a car crosses.
- Provide an overhead stream for the live page and for OBS.
- Never be the only source of timing. IR beams are primary; the camera is a
  backup and a spectacle.

## Two different jobs

**Timing** is a narrow strip. Use a virtual beam per lane: a thin region of
interest at the finish line, background subtraction or frame differencing, and a
refractory period. This is robust and cheap.

**Overhead tracking** is the whole track. Detect cars, follow them, and draw an
animated map. This is a nicer problem but a worse timing sensor, because cars
occlude each other and lights reflect.

Start with the narrow strip.

## Resolution reality

HO cars are about 2.5 inches long. With a 4K camera 10 ft above the track and a
wide lens, a car is only a few tens of pixels. That is enough to detect a
crossing in a known region, and not enough to identify a car by shape.

- Mount the camera rigidly. Any bump breaks the calibration.
- Use a prime or a good zoom, not the widest phone lens.
- Light the track evenly and keep ceiling lights out of the frame.
- Calibrate with four known points on the table, then store the homography.
- Record the empty track once to build a background model.

## Event contract

```json
{
  "type": "lap",
  "lane": 2,
  "carId": null,
  "at": "2026-11-25T09:14:03.182Z",
  "source": "camera",
  "confidence": 0.86,
  "frame": 148223
}
```

Send events to the race app over a local WebSocket. Include a confidence and a
frame number so a bad detection can be reviewed.

## Stack

- Python 3.12
- OpenCV
- Optional: Ultralytics YOLO for car detection, ONNX runtime on a Pi
- MediaMTX or go2rtc for WebRTC if phones need the stream
- No cloud. Race night should work with the internet unplugged.

## CI contract

When code lands here, add a `pyproject.toml` with a `dev` extra containing
`ruff` and `pytest`. The CI job installs `.[dev]`, runs `ruff check .` and
`pytest -q` when they are available, and falls back to `compileall` until then.
Keep tests under `services/vision/tests`.

## Privacy

A camera pointed at a table in your home is still a camera. Keep the stream on
the LAN by default. Do not add a public tunnel without a clear warning and an
access code.
