function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function loadCSS(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

// Load intl-tel-input assets, then run main script
Promise.all([
  loadCSS("https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/css/intlTelInput.min.css"),
  loadScript("https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/intlTelInput.min.js"),
  loadScript("https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js"),
]).then(() => {
  (function () {
    let num1, num2, correctAnswer;
    let iti;

    const generateCaptcha = () => {
      num1 = Math.floor(Math.random() * 5) + 1;
      num2 = Math.floor(Math.random() * 6) + 1;
      correctAnswer = num1 + num2;

      document.getElementById("captcha_question").textContent = `What is ${num1} + ${num2}?`;
      document.getElementById("captcha_answer").value = "";
    };

    const checkForms = () => {
      const forms = document.querySelectorAll("#lead_form");
      if (forms.length > 1) {
        console.error("⚠️ Multiple #lead_form elements found.");
      }
    };

    const getEvent = () => {
      const eventIdInput = document.querySelector('[name="event_id"]');
      if (!eventIdInput) return;

      const eventId = eventIdInput.value;
      fetch(`https://api.3themind.com/v1/event/${eventId}`)
        .then((res) => res.json())
        .then((data) => loadEventDates(data.memberships))
        .catch((err) => console.error("Event Fetch Error:", err));
    };

    const loadEventDates = (memberships) => {
      const select = document.getElementById("membership_id");
      if (!select) return;

      const template = document.getElementById("upcoming_dates");
      const parent = template?.parentElement;

      while (select.options.length > 1) select.remove(1);
      if (template && parent) {
        parent.querySelectorAll(".cloned-date").forEach(el => el.remove());
      }

      const now = Date.now();
      const upcoming = memberships
        .filter((m) => parseInt(m.dates[0]?.date || "0") * 1000 > now)
        .sort((a, b) => parseInt(a.dates[0].date) - parseInt(b.dates[0].date));

      upcoming.forEach((m) => {
        const date = new Date(parseInt(m.dates[0].date) * 1000);
        const dateText = date.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        });

        const label = m.price === 0
          ? `${m.name}, ${dateText} - Free`
          : `${m.name}, ${dateText} - £${m.price}`;

        const option = new Option(label, m.id);
        select.add(option);

        if (template && parent) {
          const clone = template.cloneNode(true);
          clone.classList.add("cloned-date");
          clone.style.display = "block";
          clone.textContent = dateText;
          parent.appendChild(clone);
        }
      });

      template.remove();
    };

    window.addEventListener("load", function () {
      generateCaptcha();
      checkForms();
      getEvent();

      const phoneInput = document.getElementById("lead_form_phone");
      const form = document.getElementById("lead_form");
      const errorDiv = document.getElementById("lead_form_error");

      if (phoneInput) {
        iti = window.intlTelInput(phoneInput, {
          initialCountry: "auto",
          geoIpLookup: function (success) {
            fetch("https://ipinfo.io/json?token=506134bdff2547")
              .then((resp) => resp.json())
              .then((resp) => success(resp.country))
              .catch(() => success("US"));
          },
          utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js",
          nationalMode: false,
          autoPlaceholder: "aggressive",
          formatOnDisplay: true,
        });
      }

      if (form) {
        form.addEventListener("submit", async function (e) {
          e.preventDefault();

          const userAnswer = parseInt(document.getElementById("captcha_answer").value);
          if (userAnswer !== correctAnswer) {
            errorDiv.style.display = "block";
            errorDiv.textContent = "❌ Wrong answer. Please try again!";
            generateCaptcha();
            return;
          }

          const formData = new FormData(form);

          if (iti && phoneInput && iti.isValidNumber()) {
            const fullPhone = iti.getNumber();
            formData.set("phone", fullPhone);
          } else {
            errorDiv.style.display = "block";
            errorDiv.textContent = "Please enter a valid phone number.";
            return;
          }

          try {
            const response = await fetch(form.action, {
              method: "POST",
              body: formData,
            });

            const result = await response.json();

            if (response.ok) {
              const redirectUrl = result.redirect_url || formData.get("redirect_url");
              if (redirectUrl) window.location.href = redirectUrl;
              else console.error("Missing redirect URL.");
            } else {
              const issues = result?.error?.issues;
              if (issues?.length) {
                errorDiv.textContent = issues.map((i) => i.message).join("\n");
              } else {
                errorDiv.textContent =
                  result.error || result.message || "Form submission failed.";
              }
              errorDiv.style.display = "block";
            }
          } catch (err) {
            console.error("Submission Error:", err);
            errorDiv.textContent = "Network error. Please try again.";
            errorDiv.style.display = "block";
          }
        });
      }
    });
  })();
}).catch((err) => {
  console.error("Failed to load phone input dependencies:", err);
});

