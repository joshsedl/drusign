(function ($, Drupal) {
  Drupal.behaviors.drusignAcceptContract = {
    attach: function (context, settings) {
      // On load, run once:
      $('.drusign-decrypt', context)
        .once("drusign-decrypted")
        .each(function () {
          var $decryptElement = $(this);
          // Hide Vertragsempfänger name and encrypted contract content:
          $decryptElement.parents('article:first').find('h2.node__title').hide();
          $decryptElement.hide();
          // Hide "Contract Recipient Content" Contract label:
          $decryptElement.prev('div.field__label').hide();
          // Add decoded Text div:
          var $decodedElement = $('<div>')
            .attr("id", "decodedDiv")
            .addClass("decodedText")
            .addClass("drusign-decrypted")
            .text("No Private Key uploaded!!");
          // Append div to "kundeninhalt" field aka the 'contract recipient content':
          $(this).parent().append($decodedElement);
          // Encrypt the contract if the correct privateKey was fetched:
          if (!helper.empty(window.localStorage.getItem("privateKeyCustomer"))) {
            var encrypted_text = $decryptElement.text();
            // Trim string so openpgp can decrypt the message:
            var trimed_encrypted_text = encrypted_text.trim();
            drusignCrypto.decryptCustomer(trimed_encrypted_text).then((unencrypted_text) => {
              $decodedElement.text(unencrypted_text);
            });
          } else {
            alert("Note that you need to upload your Private Key to see your Contract!");
          }
        });
        // Use File as PrivateKey Input and save the privateKey with the passphrase in the cache:
      $("#uploadKey", context).click(function (e) {
        e.preventDefault();
        let privFile = $("#privFileUpload").prop("files")[0];
        let passphrase = $('#privFilePassphrase').val();
        fetchAndCache.uploadCustomerPrivateKeyInCache(privFile, passphrase).then(() => {
          window.location.reload();
        });
      });
      // Print/Download the contract:
      $("#downloadContract", context).click(function (e) {
        e.preventDefault();
        window.print();
      });
    },
  };
})(jQuery, Drupal);
