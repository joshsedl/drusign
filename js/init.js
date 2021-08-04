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
            // Hide encrypted Vertragsinhalt, Kundeninhalt field and the Status field:
            $("#edit-field-vertragsinhalt-wrapper", $form).hide();
            $('#edit-field-vertrags-empfaenger-0-inline-entity-form-field-kundeninhalt-wrapper', $form).hide();
            $("#edit-field-status-wrapper", $form).hide();
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
            //"Your Public Key is not fetched yet! Visit " + window.location.host + "/drusign/keysUpload" + " to fetch your public Key!"
            // if (
            //
            //   window.confirm(
            //     "Your Public/Private KeyPair hasn't been fetched yet, press ok to fetch them. If you Cancel, you can't create/modify your Contract"
            //   )
            // ) {
            //   window.open(
            //     window.location.host + "/drusign/keysUpload",
            //     "_blank"
            //   );
            // }
          }

          // ## ON SUBMIT ##
          // Hint: using form.submit() event doesn't work as Drupal doesn't like
          // form submits triggered by JavaScript!
          // So let's take the button...
          $('input#edit-submit', $form).click(function (e) {
            var $submit = $(this);
            // Do not submit until the text is encrypted:
            e.preventDefault();
            var unencrypted_text = $("textarea#unencrypted_text", $form).val();
            var customerMail = $('#edit-field-vertrags-empfaenger-0-inline-entity-form-field-email-0-value', $form).val();
            drusignCrypto.encrypt(unencrypted_text).then((encrypted_text) => {
              // Set encrypted text:
              $("#edit-field-vertragsinhalt-wrapper textarea", $form).val(encrypted_text);
              drusignCrypto.encryptCustomer(unencrypted_text, customerMail).then((encrypted_text_customer)=> {
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
