document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('button');
  const resultDiv = document.createElement('div');
  resultDiv.id = 'result';
  document.body.appendChild(resultDiv);

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Generating...';
    resultDiv.innerHTML = '';
    try {
      const response = await fetch('/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to generate news story');
      const data = await response.json();
      resultDiv.innerHTML = data.htmlContent;
    } catch (err) {
      resultDiv.innerHTML = `<span style="color:red">${err.message}</span>`;
    }
    button.disabled = false;
    button.textContent = 'Generate News Story';
  });
});
