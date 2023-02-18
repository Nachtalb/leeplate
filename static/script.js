const form = document.querySelector("#translate-form");
const inputTextArea = document.querySelector("#text");
const outputTextArea = document.querySelector("#translation");
const sourceLanguageSelect = document.querySelector("#source_language");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const data = {
    text: formData.get("text"),
    source_language: formData.get("source_language"),
    target_language: formData.get("target_language"),
  };

  const response = await fetch("/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  outputTextArea.value = result.text;
  if (formData.get("source_language") == "auto")
    sourceLanguageSelect.value = result.src;

  // Create new "Listen" buttons
  const inputAudioButton = document.querySelector("#input-audio-button");
  inputAudioButton.disabled = false
  inputAudioButton.removeEventListener("click", inputAudioButton.onclick)
  inputAudioButton.addEventListener("click", async () => {
    const lang = result.src;
    const audioResponse = await fetch(`/speak?text=${encodeURIComponent(result.origin)}&lang=${lang}`);
    const audioBlob = await audioResponse.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);
    audio.play();
  });

  const outputAudioButton = document.querySelector("#output-audio-button");
  outputAudioButton.disabled = false
  outputAudioButton.removeEventListener('click', outputAudioButton.onclick)
  outputAudioButton.addEventListener("click", async () => {
    const lang = result.dest;
    const audioResponse = await fetch(`/speak?text=${encodeURIComponent(result.text)}&lang=${lang}`);
    const audioBlob = await audioResponse.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);
    audio.play();
  });
});
