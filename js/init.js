(function ($, Drupal) {
  Drupal.behaviors.drusigninit = {
    attach: function (context, settings) {
      // ## ON LOAD: ###
      //Runs only once, see https://www.drupal.org/forum/support/module-development-and-code-questions/2018-06-15/run-js-funtion-once-not-attach-once
      $('form#node-vertrag-edit-form, form#node-vertrag-form', context)
        .once("drusign-init")
        .each(function () {
          var $form = $(this);
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
              console.log("init");
              var encrypted_text = $("#edit-field-vertragsinhalt-wrapper textarea", $form).val();
              drusignCrypto.decrypt(encrypted_text).then((unencrypted_text) => {
                $("textarea#unencrypted_text", $form).val(unencrypted_text);
              });
            }
          } else {
            //Hide everything, so the Contract can't be created:
            $(this).hide();
            $('h1').hide();
            $('div.region--breadcrumb').append(
              $('<h1>')
                .attr("id", "noKey")
                .addClass("noKeyClass")
                .text("Please upload your Public/Private Key Pair under the 'Schlüssel' Tab!")
            );
            alert("Your Public Key is not fetched yet! Visit the 'Schlüssel' Page to fetch your public Key!");
          }

          // ## ON SUBMIT ##
          // Hint: using form.submit() event doesn't work as Drupal doesn't like
          // form submits triggered by JavaScript!
          // So let's take the button...
          $('input#edit-submit', $form).click(function (e) {
            var $submit = $(this);
            // Do not submit until the text is encrypted:
            e.preventDefault();
            var vertragsbezeichnung = $('#edit-title-0-value', $form).val();
            var unencrypted_text = $("textarea#unencrypted_text", $form).val();
            var unencryptedTextWithTitle = "<h2>" + vertragsbezeichnung+ "</h2>" + unencrypted_text;
            var customerMail = $('#edit-field-vertrags-empfaenger-0-inline-entity-form-field-email-0-value', $form).val();
            // Create a random verification string and put the random string in the 'verifizierung' field:
            var verificationString = helper.makeid(12);
            $("#edit-field-vertrags-empfaenger-0-inline-entity-form-field-verifizierung-0-value", $form).val(verificationString);
            drusignCrypto.encrypt(unencrypted_text).then((encrypted_text) => {
              // Set encrypted text:
              $("#edit-field-vertragsinhalt-wrapper textarea", $form).val(encrypted_text);
              drusignCrypto.encryptCustomer(unencryptedTextWithTitle, customerMail).then((encrypted_text_customer)=> {
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
