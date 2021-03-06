(function ($, Drupal) {
  Drupal.behaviors.drusignViewInit = {
    attach: function (context, settings) {
      // On load, run only once:
      $(document, context)
        .once("drusign-init")
        .each(function () {
          if (
            !helper.empty(window.localStorage.getItem("privateKey")) ||
            !helper.empty(window.localStorage.getItem("publicKey"))
          ) {
            // Change encrypted div with decrypted div:
            $('div.text-content div.field__item').hide();
            $('div.text-content').append(
              $('<div>')
                .attr("id", "decodedDiv")
                .addClass("decodedText")
                .text("Loading...")
            );
            var encrypted_text = $('div.text-content div.field__item').text();
            //Trim string so openpgp can decrypt the Message:
            var trimed_encrypted_text = encrypted_text.trim();
            // Decrypt encrypted text and save it in decrypted div:
            drusignCrypto.decrypt(trimed_encrypted_text).then((unencrypted_text) => {
              $("#decodedDiv").html(unencrypted_text);
            });
          } else {
            // If the keypair isn't fetched, hide all and display message:
            //$("div.block-olivero-page-title").hide(); //TODO: Bei Benutzern wird weiterhin der Title des Vertrags angezeigt, aber nicht beim Admin?
            $("div.region--content").hide();
            $("div.shortcut-wrapper").hide();
            $('div.region--breadcrumb').append(
              $('<h2>')
                .attr("id", "noKeyText")
                .addClass("noKeyTextClass")
                .text("Please upload your Public/Private Key Pair under the 'Upload Keypair' Tab, to view and send your Contract!")
            );
            alert("Your Public Key is not fetched yet! Visit the 'Upload Keypair' Page to fetch your public Key!");
          }
        });
    },
  };
})(jQuery, Drupal);
