
(function () {


  let num1, num2, correctAnswer;

  const generateCaptcha = () => {
    num1 = Math.floor(Math.random() * 10) + 1;
    num2 = Math.floor(Math.random() * 10) + 1;
    correctAnswer = num1 + num2;

    document.getElementById("captcha_question").textContent = `What is ${num1} + ${num2}?`;
    document.getElementById("captcha_answer").value = "";

  }

  const checkForms = () => {
    const forms = document.querySelectorAll("#lead_form");

    if (forms.length > 1) {
      console.error("⚠️ Multiple lead pickup forms detected on this page. Only one form with ID 'lead_form' should exist. Having more than one may cause unexpected behavior.");
    }
  }



  window.addEventListener("load", function () {
    generateCaptcha(); // show captcha on load
    checkForms(); //check form count

    const form = document.getElementById("lead_form");
    const errorDiv = document.getElementById("lead_form_error");

    if (form) {
      form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const userAnswer = parseInt(document.getElementById("captcha_answer").value);
        if (userAnswer !== correctAnswer) {
          errorDiv.style.display = "block";
          errorDiv.textContent = '❌ Wrong answer. Please try again!'
          generateCaptcha(); // regenerate new question
          return;
        }

        const formData = new FormData(form);


        try {
          const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            const redirectUrl = result.redirectUrl || formData.get("redirect_url");
            if (!redirectUrl) {
              console.error("Error:", 'no redirect url detected from the event data, defaulting to form data');
            }
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
              errorDiv.textContent = errorResult.error || errorResult.message || "An error occurred during submission.";
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
