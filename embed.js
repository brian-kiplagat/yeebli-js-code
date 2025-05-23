
(function () {
    const siteKey = "0x4AAAAAABCbrufzZroJH3VC"; // Replace with your Turnstile site key


    // Store CAPTCHA response globally
    window.onTurnstileSuccess = function (token) {
        window.cfTurnstileToken = token;
    };

    function injectTurnstile() {
        if (document.querySelector(".cf-turnstile")) return;

        const form = document.getElementById("lead_form");
        if (!form) return;

        const captchaDiv = document.createElement("div");
        captchaDiv.className = "cf-turnstile";
        captchaDiv.setAttribute("data-sitekey", siteKey);
        captchaDiv.setAttribute("data-callback", "onTurnstileSuccess");

        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.before(captchaDiv);
        } else {
            form.appendChild(captchaDiv);
        }

        if (!document.querySelector('script[src*="challenges.cloudflare.com"]')) {
            const script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
            script.async = true;
            document.head.appendChild(script);
        }
    }

    async function loadEventDates(membershipId = null) {
        const select = document.getElementById("event_date");
        if (!select) return;

        try {

            const uri = `https://api.3themind.com/v1/membership/${membershipId}/dates-for-plan`
            const response = await fetch(uri);
            const dates = await response.json();


            select.innerHTML = "";

            if (!Array.isArray(dates) || dates.length === 0) {
                select.innerHTML = '<option value="">No dates available</option>';
                return;
            }
            // Add default unselected option
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "Select a date";
            select.appendChild(defaultOption);


            dates.forEach(item => {
                const option = document.createElement("option");
                const date = new Date(parseInt(item.date) * 1000);

                option.value = item.id;
                option.textContent = date.toLocaleString("en-GB", {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Europe/London',
                    timeZoneName: "shortOffset",
                });

                select.appendChild(option);
            });
        } catch (err) {
            console.error("Error loading event dates:", err);
            select.innerHTML = '<option value="">Error loading dates</option>';
        }
    }
    async function loadMembershipPlans() {
        const select = document.getElementById("membership");
        if (!select) return;

        try {
            const form = document.getElementById("lead_form");
            const eventId = form.querySelector('input[name="event_id"]').value; // Get the event_id from the form
            if (!eventId) {
                console.warn('No event id detected')
            };
            const uri = `https://api.3themind.com/v1/event/${eventId}`
            const response = await fetch(uri);
            const data = await response.json();
            const
                memberships = data.memberships
            console.log(data)

            select.innerHTML = "";

            if (!Array.isArray(
                memberships) ||
                memberships.length === 0) {
                select.innerHTML = '<option value="">No tickets available</option>';
                return;
            }
            // Add default unselected option
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "Select a ticket plan";
            select.appendChild(defaultOption);

            memberships.forEach(item => {
                const option = document.createElement("option");


                option.value = item.id;
                option.textContent = item.name;
                select.appendChild(option);
            });

        } catch (err) {
            console.error("Error loading memberships:", err);
            select.innerHTML = '<option value="">Error loading memberships</option>';
        }
    }
    window.addEventListener("load", function () {
        injectTurnstile();
        loadMembershipPlans();

        const form = document.getElementById("lead_form");
        const errorDiv = document.getElementById("lead_form_error");

        if (form) {
            form.addEventListener("submit", async function (e) {
                e.preventDefault();

                if (!window.cfTurnstileToken) {
                    alert("Please complete the CAPTCHA first.");
                    return;
                }

                let input = form.querySelector('input[name="cf-turnstile-response"]');
                if (!input) {
                    input = document.createElement("input");
                    input.type = "hidden";
                    input.name = "cf-turnstile-response";
                    form.appendChild(input);
                }
                input.value = window.cfTurnstileToken;



                const formData = new FormData(form);
                const redirectUrl = formData.get("redirect_url");

                try {
                    const response = await fetch(form.action, {
                        method: 'POST',
                        body: formData,
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log("Success:", result);
                        if (redirectUrl) {
                            window.location.href = redirectUrl;
                        }
                    } else {
                        const errorResult = await response.json();
                        console.error("Error:", errorResult);

                        if (errorResult?.error?.issues?.length > 0) {
                            // Extract and join all validation error messages
                            const messages = errorResult.error.issues.map(issue => issue.message).join("\n");
                            errorDiv.textContent = messages;
                        } else {
                            errorDiv.textContent = errorResult.message || "An error occurred during submission.";
                        }

                        errorDiv.style.display = "block";
                    }
                } catch (error) {
                    console.error("Fetch Error:", error);
                    errorDiv.textContent = "Network error. Please try again.";
                    errorDiv.style.display = "block";
                }

            });
            const membershipSelect = document.getElementById("membership");
            if (membershipSelect) {
                membershipSelect.addEventListener("change", function (e) {
                    const selectedMembershipId = e.target.value;
                    loadEventDates(selectedMembershipId); // Reload dates for the selected membership
                });
            }
        }
    });
})();
