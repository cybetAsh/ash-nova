document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form[action='/topup']");
  if (form) {
    form.addEventListener("submit", (e) => {
      alert("Your top-up request is being processed!");
    });
  }
});