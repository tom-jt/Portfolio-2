# /home ambient sounds

Recordings from [Moodist](https://github.com/remvze/moodist)
(`public/sounds/`), whose third-party sounds are all either **CC0** or under
the **Pixabay Content License**. Both allow free use, commercial included,
with no attribution required.

| file                 | Moodist source                 | used in            |
| -------------------- | ------------------------------ | ------------------ |
| `rain-on-window.mp3` | `rain/rain-on-window.mp3`      | glass, storm, café |
| `light-rain.mp3`     | `rain/light-rain.mp3`          | hill               |
| `rain-on-leaves.mp3` | `rain/rain-on-leaves.mp3`      | hill               |
| `heavy-rain.mp3`     | `rain/heavy-rain.mp3`          | storm              |
| `thunder.mp3`        | `rain/thunder.mp3`             | storm              |
| `cafe.mp3`           | `places/cafe.mp3`              | café               |
| `wind.mp3`           | `nature/wind.mp3`              | hill, waves, city  |
| `waves.mp3`          | `nature/waves.mp3`             | waves              |
| `seagulls.mp3`       | `animals/seagulls.mp3`         | shore              |
| `campfire.mp3`       | `nature/campfire.mp3`          | majula             |
| `howling-wind.mp3`   | `nature/howling-wind.mp3`      | snow, city         |
| `wind-in-trees.mp3`  | `nature/wind-in-trees.mp3`     | woods              |

Each was loudness-matched to −20 LUFS and re-encoded as VBR MP3, and the
longer ones trimmed to 45–75 s (the campfire to 60 s; thunder keeps its full 68 s, for the gaps
between claps). The page crossfades each file's end into its start, so they
loop without a seam.

The café's light jazz isn't a recording: `lib/home/ambience.ts` composes it
as it plays.

`majula.mp3` is "Majula" from the *Dark Souls II* soundtrack (Motoi
Sakuraba, © Bandai Namco / FromSoftware). It is **not** CC0: it's included
with permission for non-commercial use only, trimmed of its silent ends and
loudness-matched like the rest.
