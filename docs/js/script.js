document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    const submitButton = document.getElementById("submitButton");

    if (form && submitButton) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            console.log("Form submission triggered");

            if (submitButton.disabled) return;

            submitButton.disabled = true;

            const formData = new URLSearchParams(new FormData(form));

            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: formData.toString(),
                });

                if (response.ok) {
                    showPopup("Comment submitted successfully!");
                    form.reset();
                } else {
                    const errorMessage = await response.text();
                    console.error(`Failed to send comment: ${errorMessage}`);
                    showPopup(`Failed to send comment: ${errorMessage}`);
                }
            } catch (error) {
                console.error("Error submitting the form:", error);
                showPopup("An error occurred while sending your comment. Please try again.");
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    // Handle comment deletion
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const commentId = e.target.getAttribute("data-id");

            if (confirm("Are you sure you want to delete this comment?")) {
                try {
                    const response = await fetch("/admin/comments/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({ id: commentId }),
                    });

                    if (response.ok) {
                        showPopup("Comment deleted successfully!", "success");
                        e.target.closest("tr").remove(); // Remove the comment row from the table
                    } else {
                        showPopup("Failed to delete the comment. Please try again.", "error");
                    }
                } catch (error) {
                    console.error("Error deleting the comment:", error);
                    showPopup("An error occurred. Please try again.", "error");
                }
            }
        }
    });

    // Function to show a styled pop-up message
    function showPopup(message) {
        const popup = document.getElementById("popup");
        const popupMessage = document.getElementById("popup-message");
        const popupClose = document.getElementById("popup-close");

        // Set the message
        popupMessage.textContent = message;

        // Show the pop-up
        popup.classList.remove("hidden");

        // Close the pop-up when the close button is clicked
        popupClose.addEventListener("click", () => {
            popup.classList.add("hidden");
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        const menuToggle = document.getElementById("menu-toggle");
        const navLinks = document.getElementById("nav-links");

        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("show");
        });
    });
});