const genBtn = document.getElementById('genBtn');
const numberInput = document.getElementById('number');
const resultDiv = document.getElementById('result');

genBtn.addEventListener('click', async () => {
  const number = numberInput.value.trim();
  resultDiv.innerHTML = '';
  if (!number) { resultDiv.innerHTML = '<div class="small" style="color:red">Number দিন</div>'; return; }

  genBtn.disabled = true;
  genBtn.innerText = 'Generating...';

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ number })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error');

    const expires = new Date(data.expiresAt).toLocaleString();

    resultDiv.innerHTML = `
      <p><b>Pair Code:</b> <code>${data.code}</code></p>
      <p class="small">Expires: ${expires}</p>
      <img class="qr" src="${data.qrDataUrl}" />
      <p><a href="${data.pairUrl}" target="_blank">Open Pair URL</a></p>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="small" style="color:red">${err.message}</div>`;
  } finally {
    genBtn.disabled = false;
    genBtn.innerText = 'Generate Pair Code';
  }
});
