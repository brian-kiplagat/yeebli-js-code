(function () {
    let num1, num2, correctAnswer

    const generateCaptcha = () => {
        num1 = Math.floor(Math.random() * 10) + 1
        num2 = Math.floor(Math.random() * 10) + 1
        correctAnswer = num1 + num2

        document.getElementById('captcha_question').textContent =
            `What is ${num1} + ${num2}?`
        document.getElementById('captcha_answer').value = ''
    }

    const checkForms = () => {
        const forms = document.querySelectorAll('#lead_form')

        if (forms.length > 1) {
            console.error(
                "⚠️ Multiple lead pickup forms detected on this page. Only one form with ID 'lead_form' should exist. Having more than one may cause unexpected behavior.",
            )
        }
    }

    const getEvent = () => {
        const eventId = document.querySelector('[name="event_id"]').value

        fetch(`https://api.3themind.com/v1/event/${eventId}`)
            .then((response) => response.json())
            .then((data) => {
                console.log(data)
                loadEventDates(data.memberships)
            })
            .catch((error) => {
                console.error('Error:', error)
            })
    }

    const loadEventDates = (memberships) => {
        const ticketDateSelect = document.getElementById('membership_id')
        if (!ticketDateSelect) return

        // Clear existing options except the first one
        while (ticketDateSelect.options.length > 1) {
            ticketDateSelect.remove(1)
        }

        // Sort memberships by their first (and only) date
       const now = Date.now()
       const sortedMemberships = memberships
        .filter((membership) => {
            const date = parseInt(membership.dates[0]?.date || '0') * 1000
            return date > now // keep only future dates
        })
        .sort((a, b) => {
            const aDate = parseInt(a.dates[0].date) * 1000
            const bDate = parseInt(b.dates[0].date) * 1000
            return aDate - bDate
        })
      
        sortedMemberships.forEach((membership) => {
            const dateEntry = membership.dates[0]
            if (!dateEntry) return // Skip if no date

            const dateObj = new Date(parseInt(dateEntry.date) * 1000)
            const formattedDate = dateObj.toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
            })

            const optionText = membership.price === 0 ? `Free - ${membership.name} ${formattedDate}` : `£${membership.price} ${membership.name} ${formattedDate}`
            const option = new Option(optionText, membership.id)
            ticketDateSelect.add(option)
        })
    }

    window.addEventListener('load', function () {
        generateCaptcha() // show captcha on load
        checkForms() // check form count
        getEvent()

        const form = document.getElementById('lead_form')
        const errorDiv = document.getElementById('lead_form_error')

        if (form) {
            form.addEventListener('submit', async function (e) {
                e.preventDefault()

                const userAnswer = parseInt(
                    document.getElementById('captcha_answer').value,
                )
                if (userAnswer !== correctAnswer) {
                    errorDiv.style.display = 'block'
                    errorDiv.textContent = '❌ Wrong answer. Please try again!'
                    generateCaptcha() // regenerate new question
                    return
                }

                const formData = new FormData(form)

                try {
                    const response = await fetch(form.action, {
                        method: 'POST',
                        body: formData,
                    })

                    if (response.ok) {
                        const result = await response.json()
                        const redirectUrl =
                            result.redirect_url || formData.get('redirect_url')
                        if (!redirectUrl) {
                            console.error(
                                'Error:',
                                'no redirect url detected from the event data, defaulting to form data',
                            )
                        }
                        if (redirectUrl) {
                            window.location.href = redirectUrl
                        }
                    } else {
                        const errorResult = await response.json()
                        console.error('Error:', errorResult)

                        if (errorResult?.error?.issues?.length > 0) {
                            // Extract and join all validation error messages
                            const messages = errorResult.error.issues
                                .map((issue) => issue.message)
                                .join('\n')
                            errorDiv.textContent = messages
                        } else {
                            errorDiv.textContent =
                                errorResult.error ||
                                errorResult.message ||
                                'An error occurred during submission.'
                        }

                        errorDiv.style.display = 'block'
                    }
                } catch (error) {
                    console.error('Fetch Error:', error)
                    errorDiv.textContent = 'Network error. Please try again.'
                    errorDiv.style.display = 'block'
                }
            })
        }
    })
})()
