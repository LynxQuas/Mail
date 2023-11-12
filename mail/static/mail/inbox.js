document.addEventListener("DOMContentLoaded", function () {
    // Use buttons to toggle between views
    document
        .querySelector("#inbox")
        .addEventListener("click", () => load_mailbox("inbox"));
    document
        .querySelector("#sent")
        .addEventListener("click", () => load_mailbox("sent"));
    document
        .querySelector("#archived")
        .addEventListener("click", () => load_mailbox("archive"));
    document.querySelector("#compose").addEventListener("click", compose_email);

    // sending email.
    document.querySelector("#compose-form").onsubmit = (event) => {
        event.preventDefault();
        send_mail();
    };

    // By default, load the inbox
    load_mailbox("inbox");
});

function compose_email() {
    // Show compose view and hide other views
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#email-container").style.display = "none";
    document.querySelector("#compose-view").style.display = "block";

    // Clear out composition fields
    document.querySelector("#compose-recipients").value = "";
    document.querySelector("#compose-subject").value = "";
    document.querySelector("#compose-body").value = "";
}

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector("#emails-view").style.display = "block";

    document.querySelector("#email-container").style.display = "none";
    document.querySelector("#compose-view").style.display = "none";

    // Show the mailbox name
    document.querySelector("#emails-view").innerHTML = `<h3 class="text-info">${
        mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
    }</h3>`;

    get_mails(mailbox);
}

function send_mail() {
    // get the filled inputs data.
    const recipients = document.querySelector("#compose-recipients");
    const subject = document.querySelector("#compose-subject");
    const body = document.querySelector("#compose-body");
    const text = document.querySelector(".text");

    if (!recipients.value || !subject.value || !body.value) {
        text.textContent = "Sorry: Inputs must be filled.";
        return;
    }

    // Add the data with POST method.
    fetch("/emails", {
        method: "POST",
        body: JSON.stringify({
            recipients: recipients.value,
            subject: subject.value,
            body: body.value,
        }),
    })
        .then((response) => {
            if (!response.ok) throw new Error("Sorry: Mail can not be sent.");
            return response.json();
        })
        .then(() => {
            load_mailbox("sent");
        })
        .catch((error) => {
            text.textContent = error;
        });
}

function get_mails(mailbox) {
    fetch(`emails/${mailbox}`)
        .then((response) => response.json())
        .then((emails) => {
            emails.forEach((email) => {
                const container = document.createElement("div");
                const read_class = email.read ? "read" : "unread";
                container.className = "email_wrapper";

                // dont add grey background on sent.
                if (mailbox !== "sent") {
                    container.classList.add(read_class);
                }
                container.innerHTML = ` 
                  <p>From:${email.sender}</p>
                  <p>Subject:${email.subject}</p>
                  <span>${email.timestamp}</span>
                  `;

                // prevent click on sent mails.
                if (mailbox === "inbox" || mailbox === "archive") {
                    container.addEventListener("click", () => {
                        fetch(`emails/${email.id}`, {
                            method: "PUT",
                            body: JSON.stringify({
                                read: true,
                            }),
                        });
                        clickHandler(email.id);
                    });
                }
                document.querySelector("#emails-view").append(container);
            });
        });
}

// when mail is clicked.
function clickHandler(email_id) {
    // display the new container.
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "none";
    document.querySelector("#email-container").style.display = "block";

    // get the data of the mail.
    fetch(`emails/${email_id}`)
        .then((response) => response.json())
        .then((email) => {
            // display the content.
            document.querySelector("#email-container").innerHTML = `
    <div class="email-elements">
      <h3 class="text-secondary">${email.subject}  </h3>
      <p><strong>From:</strong> ${email.sender}</p>
      <p><strong>Subject:</strong> ${email.subject}</p>
      <p><small>${email.timestamp}</small></p>
    <div>
        <button class="btn btn-danger" id="btn_archived">${
            email.archived ? "Unarchive" : "Archived"
        }</button>
        <button class="btn btn-primary" id="btn_reply">Reply</button>
      </div>
    <hr/>
    <h5 class="text-secondary">Body</h5>
      <p>${email.body}</p>
    </div>
    `;
            // add the click event on archived.
            const btn_archived = document.querySelector("#btn_archived");
            btn_archived.onclick = () => archive_click_handler(email);

            // add the click event on reply.
            const btn_reply = document.querySelector("#btn_reply");
            btn_reply.onclick = () => reply_click_handler(email);
        });
}

// when the archive is clicked.
function archive_click_handler(email) {
    // updated the archive.
    fetch(`emails/${email.id}`, {
        method: "PUT",
        body: JSON.stringify({
            archived: !email.archived,
        }),
    })
        // load the inbox.
        .then(() => {
            load_mailbox("inbox");
        });
}

// when the reply button is clicked.
function reply_click_handler(email) {
    // get the clicked mail's data.
    fetch(`emails/${email.id}`)
        .then((response) => response.json())
        .then((responseEmail) => {
            // redirect to compose page.
            compose_email();

            // get the data from inputs.
            const recipients = document.querySelector("#compose-recipients");
            const subject = document.querySelector("#compose-subject");
            const body = document.querySelector("#compose-body");

            // fill the reply inputs.
            recipients.value = responseEmail.sender;

            const prefill_subject = "Re:";
            const first_two_text = responseEmail.subject
                .slice(0, 3)
                .toLowerCase();

            subject.value =
                first_two_text === prefill_subject.toLowerCase()
                    ? responseEmail.subject
                    : `${prefill_subject} ${responseEmail.subject}`;

            body.value = `On ${responseEmail.timestamp} ${responseEmail.sender} wrote:\n${responseEmail.body} \r\n\r\n --- \r\n\r\n`;
        });
}
