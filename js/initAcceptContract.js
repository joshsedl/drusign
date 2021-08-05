(function ($, Drupal) {
  Drupal.behaviors.drusignAcceptContract = {
    attach: function (context, settings) {
      // ## ON LOAD: ###
      // Runs only once, see https://www.drupal.org/forum/support/module-development-and-code-questions/2018-06-15/run-js-funtion-once-not-attach-once
      $('.drusign-decrypt', context)
        .once("drusign-decrypted")
        .each(function () {
          console.log('init');
          var $decryptElement = $(this);

          // Hide Vertragsempfänger name and encrypted contract content:
          $decryptElement.parents('article:first').find('h2.node__title').hide();
          $decryptElement.hide();
          // Change Contract label:
          $decryptElement.prev('div.field__label').text('Ihr Vertrag:');
          // Add decoded Text div:
          var $decodedElement = $('<div>')
            .attr("id", "decodedDiv")
            .addClass("decodedText")
            .addClass("drusign-decrypted")
            .text("No Private Key uploaded!!");

          $(this).parent().append($decodedElement);
          if (!helper.empty(window.localStorage.getItem("privateKeyCustomer"))) {
            var encrypted_text = $decryptElement.text();
            //Trim string so openpgp can decrypt the Message:
            var trimed_encrypted_text = encrypted_text.trim();
            drusignCrypto.decryptCustomer(trimed_encrypted_text).then((unencrypted_text) => {
              $decodedElement.text(unencrypted_text);
            });
          } else {
            alert("Note that you need to upload your Private Key to see your Contract!");
          }
        });
        //Use File as PrivateKey Input and save the privateKey with the passphrase in the Cache
      $("#uploadKey", context).click(function (e) {
        e.preventDefault();
        let privFile = $("#privFileUpload").prop("files")[0];
        let passphrase = $('#privFilePassphrase').val();
        fetchAndCache.uploadCustomerPrivateKeyInCache(privFile, passphrase).then(() => {
          window.location.reload();
        });
      });
      //Save Contract Locally Logic
      $("#downloadContract", context).click(function (e) {
        e.preventDefault();
        window.print();
      });
    },
  };
})(jQuery, Drupal);
