# Timing electronics

The camera is for watching. The beam is for timing.

## Ranked options

1. **IR beam per lane.** Cheap, fast, works in the dark, no model training.
   A car breaks the beam, the microcontroller timestamps the edge.
2. **Current sensing.** No beam to align, but needs isolation and a threshold
   per lane. More analog work.
3. **Camera only.** No track modification, but lighting, reflections and
   occlusion make it a backup, not the primary sensor.
4. **RFID.** The only reliable way to identify a car rather than a lane.

## IR beam bill of materials

Per lane:

- 1 x IR LED, 940 nm
- 1 x IR phototransistor or photodiode
- 1 x 220 ohm resistor for the LED
- 1 x 10k resistor for the phototransistor
- Optional comparator for a clean digital edge

Per track:

- ESP32 or RP2040 board
- 5 V supply, separate from track power
- JST or screw terminals
- A length of black card or tube to shield the beam from room light

## Mounting

- Put the beam just above the slot, across the lane, at the start/finish line.
- Shield the receiver from the ceiling lights and from the next lane's LED.
- One beam per lane, no shared receiver. Shared receivers cause crosstalk and
  missed laps when two cars cross together.
- Keep the beam 10 to 20 mm above the track so a guide pin cannot trip it, only
  the car body.

## Firmware behaviour

- Timestamp on the falling edge.
- Refractory period per lane, typically 80 to 150 ms. A car cannot complete a
  real lap faster than that.
- Send a compact event immediately. Do not batch.
- Include a sequence number so the race app can detect a dropped packet.
- Report a heartbeat so the app can show "sensor offline" instead of silently
  missing laps.

## Event contract

```json
{ "type": "lap", "lane": 2, "carId": null, "at": "2026-11-25T09:14:03.182Z", "source": "ir", "confidence": 1 }
```

The race app owns the race. The sensor only reports edges. A missed edge is
corrected by the race director, not by guessing in firmware.

## Safety

Track power is around 22 VDC and can spike when a car deselects. Never connect
track rails directly to a microcontroller pin. Use a separate supply, a common
ground only at one point, and opto-isolation if the sensor touches the rails.
