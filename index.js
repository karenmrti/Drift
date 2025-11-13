// ----------------------
// HANDLE SOUND BUTTON CLICK
// ----------------------
document.addEventListener("click", (e) => {
  const button = e.target.closest(".audio-toggle");
  if (!button) return;

  const id = button.dataset.audioId;
  const audio = document.getElementById(id);
  if (!audio) return;

  // Play/pause sound
  if (audio.paused) {
    const p = audio.play();
    if (p && p.catch) p.catch(() => {});
    button.classList.add("playing");
  } else {
    audio.pause();
    button.classList.remove("playing");
  }

  // Show/hide this sound's volume slider
  const track = button.closest(".track");
  const popover = track?.querySelector(`.volume-popover[data-for="${id}"]`);
  if (!popover) return;

  const slider = popover.querySelector(".volume-slider");
  if (slider) slider.value = String(audio.volume ?? 1);

  const willShow = !popover.classList.contains("show");
  popover.classList.toggle("show", willShow);
  popover.setAttribute("aria-hidden", willShow ? "false" : "true");
  button.setAttribute("aria-expanded", willShow ? "true" : "false");
});


// ----------------------
// PER-SOUND SLIDER UPDATES BASE VOLUME
// ----------------------
let masterVolume = 1; // global multiplier

document.addEventListener("input", (e) => {
  const slider = e.target.closest(".volume-slider");
  if (!slider) return;

  const popover = slider.closest(".volume-popover");
  const id = popover.getAttribute("data-for");
  const audio = document.getElementById(id);
  if (!audio) return;

  // Base volume (0–1)
  const base = parseFloat(slider.value);
  const clampedBase = Math.max(0, Math.min(1, isNaN(base) ? 1 : base));
  slider.value = clampedBase;

  // Apply base × master
  audio.volume = clampedBase * masterVolume;
});


// ----------------------
// MASTER VOLUME POPUP TOGGLE + MASTER CONTROL
// ----------------------
const masterBtn = document.querySelector(".master-toggle");
const masterPopover = document.querySelector(".master-popover");
const masterSlider = document.getElementById("masterVolume");

if (masterBtn && masterPopover && masterSlider) {

  // Show/hide master slider
  masterBtn.addEventListener("click", () => {
    const show = !masterPopover.classList.contains("show");
    masterPopover.classList.toggle("show", show);
    masterPopover.setAttribute("aria-hidden", show ? "false" : "true");
    masterBtn.setAttribute("aria-expanded", show ? "true" : "false");
  });

  // Master volume updates all sounds (scales their base volume)
  masterSlider.addEventListener("input", () => {
    masterVolume = Number(masterSlider.value) || 0;

    document.querySelectorAll(".track").forEach(track => {
      const slider = track.querySelector(".volume-slider");
      const audio = track.querySelector("audio");
      if (!slider || !audio) return;

      const base = Number(slider.value) || 0;
      audio.volume = base * masterVolume;
    });
  });
}
