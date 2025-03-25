
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


(function () {
    const siteKey = "0x4AAAAAABCbrufzZroJH3VC"; // Replace with your Turnstile site key

    function injectTurnstile() {
        if (document.querySelector(".cf-turnstile")) return; // Avoid duplicates

        const form = document.getElementById("lead_form");
        if (!form) return;

        // Create Turnstile container
        const captchaDiv = document.createElement("div");
        captchaDiv.className = "cf-turnstile";
        captchaDiv.setAttribute("data-sitekey", siteKey);
        captchaDiv.setAttribute("data-callback", "onTurnstileSuccess");

        // Insert CAPTCHA before the submit button
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.before(captchaDiv);
        } else {
            form.appendChild(captchaDiv);
        }

        // Load Turnstile script dynamically
        if (!document.querySelector('script[src*="challenges.cloudflare.com"]')) {
            const script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
            script.async = true;
            document.head.appendChild(script);
        }
    }

    // Store CAPTCHA response globally
    window.onTurnstileSuccess = function (token) {
        window.cfTurnstileToken = token;
    };

    function handleFormSubmit(event) {
        if (!window.cfTurnstileToken) {
            event.preventDefault();
            alert("Please complete the CAPTCHA first.");
            return;
        }

        // Attach token to the form before submission
        const form = event.target;
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "cf-turnstile-response";
        input.value = window.cfTurnstileToken;
        form.appendChild(input);
    }

    // Inject Turnstile once the page is loaded
    window.addEventListener("load", function () {
        injectTurnstile();
        const form = document.getElementById("lead_form");
        if (form) {
            form.addEventListener("submit", handleFormSubmit);
        }
    });
})();

