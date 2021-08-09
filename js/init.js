(function ($, Drupal) {
  Drupal.behaviors.drusigninit = {
    attach: function (context, settings) {
      // Only run this script on the create and edit form:
      $('form#node-vertrag-edit-form, form#node-vertrag-form', context)
        // On load, run once:
        .once("drusign-init")
        .each(function () {
          var $form = $(this);
          // Only run if the keypair was fetched:
          if (
            !helper.empty(window.localStorage.getItem("privateKey")) ||
            !helper.empty(window.localStorage.getItem("publicKey"))
          ) {
            // Hide encrypted Vertragsinhalt, Kundeninhalt field, the Status field and the verification field:
            $("#edit-field-vertragsinhalt-wrapper", $form).hide();
            $('#edit-field-vertrags-empfaenger-0-inline-entity-form-field-kundeninhalt-wrapper', $form).hide();
            $("#edit-field-status-wrapper", $form).hide();
            $("#edit-field-vertrags-empfaenger-0-inline-entity-form-field-verifizierung-wrapper", $form).hide();
            // Decrypt the Contract, if we edit it:
            if ($("#edit-field-vertragsinhalt-0-value", $form).val().length > 0) {
              var encrypted_text = $("#edit-field-vertragsinhalt-wrapper textarea", $form).val();
              drusignCrypto.decrypt(encrypted_text).then((unencrypted_text) => {
                $("textarea#unencrypted_text", $form).val(unencrypted_text);
              });
            }
          // If the keypair isn't fetched:
          } else {
            //Hide everything, so the contract can't be created:
            $(this).hide();
            $('h1').hide();
            $('div.region--breadcrumb').append(
              $('<h1>')
                .attr("id", "noKey")
                .addClass("noKeyClass")
                .text("Please upload your Public/Private Key Pair under the 'Upload Keypair' Tab!")
            );
            alert("Your Public Key is not fetched yet! Visit the 'Upload Keypair' Page to fetch your public Key!");
          }

          // On submit:
          // Hint: using form.submit() event doesn't work as Drupal doesn't like
          // form submits triggered by javaScript!
          $('input#edit-submit', $form).click(function (e) {
            var $submit = $(this);
            // Do not submit until the text is encrypted:
            e.preventDefault();
            var vertragsbezeichnung = $('#edit-title-0-value', $form).val();
            var unencrypted_text = $("textarea#unencrypted_text", $form).val();
            // Encrypt the unencrypted text with the title of the contract for the "vertragsempfänger" node, since we do not have access to the title on that node:
            var unencryptedTextWithTitle = "<h2>" + vertragsbezeichnung+ "</h2>" + unencrypted_text;
            var customerMail = $('#edit-field-vertrags-empfaenger-0-inline-entity-form-field-email-0-value', $form).val();
            // Create a random verification string and put the random string in the 'verifizierung' field:
            var verificationString = helper.makeid(12);
            $("#edit-field-vertrags-empfaenger-0-inline-entity-form-field-verifizierung-0-value", $form).val(verificationString);
            // Encrypt the text for the contract holder:
            drusignCrypto.encrypt(unencrypted_text).then((encrypted_text) => {
              // Set encrypted text on the textarea of the "contract" node:
              $("#edit-field-vertragsinhalt-wrapper textarea", $form).val(encrypted_text);
              // Encrypt the text for the contract recipient:
              drusignCrypto.encryptCustomer(unencryptedTextWithTitle, customerMail).then((encrypted_text_customer)=> {
                // Set encrypted text on the textarea of the "contract recipient data" node:
                $("#edit-field-vertrags-empfaenger-0-inline-entity-form-field-kundeninhalt-0-value", $form).val(encrypted_text_customer);
                // Now submit the form:
                $submit.unbind(e);
                // Now click!
                $submit.click();
              });
            });
          });
        });
    },
  };
})(jQuery, Drupal);
