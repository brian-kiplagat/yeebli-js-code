
document.getElementById('lead_form').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent the default form submission
    
    const form = e.target;
    const formData = new FormData(form);
    const errorDiv = document.getElementById('lead_form_error');
    const redirectUrl = formData.get("redirect_url");
    
    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Success:', result);
           if (redirectUrl) {
                window.location.href = redirectUrl; // Redirect only if URL exists
            }
        } else {
            const errorResult = await response.json();
            console.error('Error:', errorResult);
            errorDiv.textContent = errorResult.message || 'An error occurred during submission.';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
});
