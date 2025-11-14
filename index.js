import { sounds } from "./sounds.js";

// ----------------------
// BUILD TRACKS FROM DATA
// ----------------------
const tracksContainer = document.getElementById("tracks");

sounds.forEach(sound => {
  const buttonContent = sound.icon
    ? `<ion-icon name="${sound.icon}"></ion-icon>`
    : sound.label;

  const trackHTML = `
    <div class="track">
      <button class="audio-toggle" data-audio-id="${sound.id}" aria-expanded="false">
        ${buttonContent}
      </button>

      <div class="volume-popover" data-for="${sound.id}" aria-hidden="true">
        <input
          class="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value="1"
        >
      </div>

      <audio id="${sound.id}" src="audio/${sound.file}" loop></audio>
    </div>
  `;

  tracksContainer.insertAdjacentHTML("beforeend", trackHTML);
});

// ----------------------
// GLOBAL MASTER VOLUME
// ----------------------
let masterVolume = 1; // multiplier for all sounds (0–1)

// ----------------------
// FADE HELPERS
// ----------------------
function clearFade(audio) {
  if (audio._fadeInterval) {
    clearInterval(audio._fadeInterval);
    audio._fadeInterval = null;
  }
}

function fadeIn(audio, targetVolume = 1, duration = 800) {
  clearFade(audio);
  audio.volume = 0;

  const steps = 20;
  const stepTime = duration / steps;
  const volumeStep = targetVolume / steps;
  let currentStep = 0;

  audio._fadeInterval = setInterval(() => {
    currentStep++;

    if (audio.paused) {
      clearFade(audio);
      return;
    }

    const newVolume = Math.min(targetVolume, audio.volume + volumeStep);
    audio.volume = newVolume;

    if (currentStep >= steps) {
      clearFade(audio);
    }
  }, stepTime);
}

function fadeOut(audio, duration = 400, onComplete) {
  clearFade(audio);

  const steps = 20;
  const stepTime = duration / steps;
  const startVolume = audio.volume;
  const volumeStep = startVolume / steps;
  let currentStep = 0;

  audio._fadeInterval = setInterval(() => {
    currentStep++;

    const newVolume = Math.max(0, audio.volume - volumeStep);
    audio.volume = newVolume;

    if (currentStep >= steps || newVolume <= 0) {
      clearFade(audio);
      audio.volume = 0;
      audio.pause();
      if (typeof onComplete === "function") onComplete();
    }
  }, stepTime);
}

// ----------------------
// HANDLE SOUND BUTTON CLICK
// ----------------------
document.addEventListener("click", (e) => {
  const button = e.target.closest(".audio-toggle");
  if (!button) return;

  const id = button.dataset.audioId;
  const audio = document.getElementById(id);
  if (!audio) return;

  const track = button.closest(".track");
  const popover = track?.querySelector(`.volume-popover[data-for="${id}"]`);
  const slider = popover?.querySelector(".volume-slider");

  // Base per-sound volume from slider (0–1)
  let baseVolume = 1;
  if (slider) {
    const val = parseFloat(slider.value);
    if (!Number.isNaN(val)) {
      baseVolume = Math.max(0, Math.min(1, val));
    }
  }

  // Final target volume = base × master
  const targetVolume = baseVolume * masterVolume;

  if (audio.paused) {
    // Play with fade-in
    const p = audio.play();
    if (p && p.catch) p.catch(() => {});
    fadeIn(audio, targetVolume, 600);
    button.classList.add("playing");
  } else {
    // Fade-out, then pause + remove state
    fadeOut(audio, 400, () => {
      button.classList.remove("playing");
    });
  }

  // Toggle this sound's volume slider
  if (!popover) return;

  const willShow = !popover.classList.contains("show");
  popover.classList.toggle("show", willShow);
  popover.setAttribute("aria-hidden", willShow ? "false" : "true");
  button.setAttribute("aria-expanded", willShow ? "true" : "false");
});

// ----------------------
// PER-SOUND SLIDER (BASE VOLUME)
// ----------------------
document.addEventListener("input", (e) => {
  const slider = e.target.closest(".volume-slider");
  if (!slider) return;

  const popover = slider.closest(".volume-popover");
  const id = popover.getAttribute("data-for");
  const audio = document.getElementById(id);
  if (!audio) return;

  const base = parseFloat(slider.value);
  const clampedBase = Math.max(0, Math.min(1, Number.isNaN(base) ? 1 : base));
  slider.value = clampedBase;

  // Actual volume = base × master
  audio.volume = clampedBase * masterVolume;
});

// ----------------------
// MASTER VOLUME + POPUP
// ----------------------
const masterBtn = document.querySelector(".master-toggle");
const masterPopover = document.querySelector(".master-popover");
const masterSlider = document.getElementById("masterVolume");

if (masterBtn && masterPopover && masterSlider) {
  // Toggle master slider popup
  masterBtn.addEventListener("click", () => {
    const show = !masterPopover.classList.contains("show");
    masterPopover.classList.toggle("show", show);
    masterPopover.setAttribute("aria-hidden", show ? "false" : "true");
    masterBtn.setAttribute("aria-expanded", show ? "true" : "false");
  });

  // Update master volume for all sounds
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
