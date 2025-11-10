
// Play the selected button
document.addEventListener("click", (e)=> {
    const button = e.target.closest(".audio-toggle");
    if(!button) return;

    const id = button.dataset.audioId;
    const audio = document.getElementById(id);
    if(!audio) return;

    if(audio.paused){
        const p = audio.play();
        if(p && p.catch) p.catch(() =>{});
        button.classList.add("playing");
    }else{
        audio.pause();
        button.classList.remove("playing");
    }

    const track = button.closest(".track");
    const popover = track?.querySelector(`.volume-popover[data-for="${id}"]`);
    if(!popover) return;

    const slider = popover.querySelector(".volume-slider");
    if(slider) slider.value = String(audio.volume ?? 1);

    const willShow = !popover.classList.contains("show");

    popover.classList.toggle("show", willShow);
    popover.setAttribute("aria-hidden", willShow ? "false" : "true");
    button.setAttribute("aria-expanded", willShow ? "true" : "false");
});

document.addEventListener("input", (e) => {
  const slider = e.target.closest(".volume-slider");
  if (!slider) return;

  const popover = slider.closest(".volume-popover");
  const id = popover.getAttribute("data-for");
  const audio = document.getElementById(id);
  if (!audio) return;

  const vol = parseFloat(slider.value);
  audio.volume = Math.max(0, Math.min(1, isNaN(vol) ? 1 : vol));
});

