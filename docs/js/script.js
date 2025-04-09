document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");

    // Handle comment submission
    form?.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        fetch(form.action, {
            method: form.method,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(data),
        })
            .then((response) => {
                if (response.ok) {
                    // Show the success pop-up
                    showPopup("Comment submitted successfully!", "success");

                    // Immediately refresh the form
                    form.reset();
                } else {
                    showPopup("Failed to submit the comment. Please try again.", "error");
                }
            })
            .catch((error) => {
                console.error("Error submitting the form:", error);
                showPopup("An error occurred. Please try again.", "error");
            });
    });

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
    function showPopup(message, type) {
        const popup = document.createElement("div");
        popup.className = `popup-message ${type}`;
        popup.textContent = message;

        document.body.appendChild(popup);

        // Remove the pop-up after 5 seconds
        setTimeout(() => {
            popup.remove();
        }, 5000);
    }
    document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
});
});