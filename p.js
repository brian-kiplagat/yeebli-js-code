<script>
(function () {
    let num1, num2, correctAnswer
    let iti // intl-tel-input instance

    const generateCaptcha = () => {
        num1 = Math.floor(Math.random() * 5) + 1
        num2 = Math.floor(Math.random() * 6) + 1
        correctAnswer = num1 + num2

        document.getElementById('captcha_question').textContent =
            `What is ${num1} + ${num2}?`
        document.getElementById('captcha_answer').value = ''
    }

    const checkForms = () => {
        const forms = document.querySelectorAll('#lead_form')
        if (forms.length > 1) {
            console.error("⚠️ Multiple lead pickup forms detected on this page.")
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
            .catch((error) => console.error('Error:', error))
    }

    const loadEventDates = (memberships) => {
        const ticketDateSelect = document.getElementById('membership_id')
        if (!ticketDateSelect) return

        while (ticketDateSelect.options.length > 1) {
            ticketDateSelect.remove(1)
        }

        const now = Date.now()
        const sortedMemberships = memberships
            .filter((m) => (parseInt(m.dates[0]?.date || '0') * 1000) > now)
            .sort((a, b) => (parseInt(a.dates[0].date) - parseInt(b.dates[0].date)))

        sortedMemberships.forEach((m) => {
            const date = new Date(parseInt(m.dates[0].date) * 1000)
            const formatted = date.toLocaleString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: 'numeric', hour12: true
            })
            const label = m.price === 0 ? `Free - ${m.name} ${formatted}` : `£${m.price} ${m.name} ${formatted}`
            const option = new Option(label, m.id)
            ticketDateSelect.add(option)
        })
    }

    window.addEventListener('load', function () {
        generateCaptcha()
        checkForms()
        getEvent()

        const phoneInput = document.getElementById('lead_form_phone')
        iti = window.intlTelInput(phoneInput, {
            initialCountry: 'auto',
            geoIpLookup: function (success, failure) {
                fetch('https://ipinfo.io/json?token=506134bdff2547') // replace with your token if needed
                    .then((resp) => resp.json())
                    .then((resp) => success(resp.country))
                    .catch(() => success('US'))
            },
            utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js',
            nationalMode: false,
            formatOnDisplay: true,
            autoPlaceholder: 'aggressive'
        })

        const form = document.getElementById('lead_form')
        const errorDiv = document.getElementById('lead_form_error')

        if (form) {
            form.addEventListener('submit', async function (e) {
                e.preventDefault()

                const userAnswer = parseInt(document.getElementById('captcha_answer').value)
                if (userAnswer !== correctAnswer) {
                    errorDiv.style.display = 'block'
                    errorDiv.textContent = '❌ Wrong answer. Please try again!'
                    generateCaptcha()
                    return
                }

                const formData = new FormData(form)

                // Replace phone with full international number
                const intlPhone = iti.getNumber()
                if (!iti.isValidNumber()) {
                    errorDiv.style.display = 'block'
                    errorDiv.textContent = 'Please enter a valid phone number.'
                    return
                }
                formData.set('phone', intlPhone)

                try {
                    const response = await fetch(form.action, {
                        method: 'POST',
                        body: formData,
                    })

                    if (response.ok) {
                        const result = await response.json()
                        const redirectUrl = result.redirect_url || formData.get('redirect_url')
                        window.location.href = redirectUrl
                    } else {
                        const errorResult = await response.json()
                        const issues = errorResult?.error?.issues
                        if (issues?.length) {
                            errorDiv.textContent = issues.map(i => i.message).join('\n')
                        } else {
                            errorDiv.textContent = errorResult.error || errorResult.message || 'Submission failed.'
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
</script>
