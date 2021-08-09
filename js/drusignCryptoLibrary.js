/**
 * A "helper" variable with several "helper" functions
 */
var helper = {
  /**
   * Tests if a given mail has the correct mail syntax using regular expressions
   *
   * @param {String} email
   * @returns {Boolean}
   */
  validateEmail: function (email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  },

  /**
   * Checks if a string is empty
   *
   * @param {String} data
   * @returns {Boolean}
   */
  empty: function (data) {
    if (typeof data === "undefined") {
      return true;
    } else if (data === "0") {
      return true;
    } else if (!data) {
      return true;
    } else if (/\S/.test(data) == "") { //Checks if a whitespace character exists in data, whitespace character can be a space/tab/new line/vertical character (/\S/ = Regex for whitespace character)
      return true;
    } else {
      return false;
    }
  },

  /**
   * Creates a random id with a given length.
   *
   * @param {Integer} length
   * @returns {String}
   */
  makeid: function (length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() *
        charactersLength));
    }
    return result;
  }
}

/**
 * A variable with functions to receive keys and cache them in the browser
 */
var fetchAndCache = {
  /**
  * Fetch a Public Key from https://keys.openpgp.org via Mail, without putting it in localStorage
  * @async
  * @param {String} mail
  * @returns {String}
  */
  returnFetchPublicKey: async function (mail) {
    if (helper.validateEmail(mail)) {
      let data = await fetch(`https://keys.openpgp.org/vks/v1/by-email/${mail}`, {
        method: 'GET',
      })
      if (data.status === 200) {
        let pubKey = await data.text()
        return pubKey;
      } else {
        alert('Incorrect Customer E-Mail Adress or the Keyserver Datbase is being maintenanced!')
        throw new Error('Incorrect E-Mail Adress or the Keyserver Datbase is being maintenanced!')
      }
    } else {
      alert('This is not a correct CustomerE-Mail Adress!')
      throw new Error('This is not an E-Mail Adress!')
    }
  },

  /**
   * Fetch a Public Key from https://keys.openpgp.org via Mail, and put it in the local storage.
   * @async
   * @param {String} mail
   */
  fetchPublicKey: async function (mail) {
    if (helper.validateEmail(mail)) {
      let data = await fetch(`https://keys.openpgp.org/vks/v1/by-email/${mail}`, {
        method: 'GET',
      })
      if (data.status === 200) {
        let pubKey = await data.text()
        console.log(pubKey)
        window.localStorage.setItem('publicKey', pubKey)
        alert('Public Key successful fetched in local Browser cache!')
      } else {
        alert('Incorrect E-Mail Adress or the Keyserver Datbase is being maintenanced!')
        throw new Error('Incorrect E-Mail Adress or the Keyserver Datbase is being maintenanced!')
      }
    } else {
      alert('This is not an E-Mail Adress!')
      throw new Error('This is not an E-Mail Adress!')
    }
  },

  /**
   * Uploads the Private Key and the Passphrase into the Browser Cache.
   * @async
   * @param {String} privKey
   * @param {String} password
   */
  uploadPrivateKeyInCache: async function (privKey, password) {
    try {
      privKey = await privKey.text()
      console.log(privKey)
    } catch (err) {
      alert('You have selected NO Private Key!')
      throw err
    }
    try {
      // Used to validate the private Key:
      await openpgp.decryptKey({
        privateKey: await openpgp.readKey({
          armoredKey: privKey,
        }),
        passphrase: password,
      })
    } catch (err) {
      alert('The selected Key is incorrect or the Passphrase is wrong!')
      throw err
    }
    window.localStorage.setItem('privateKey', privKey)
    window.localStorage.setItem('privateKeyPassword', password)
    alert('Private Key and Passphrase successful locally cached!')
  },

  /**
  * Uploads the Private Key and the Passphrase of the Contract Reveiver into the Browser Cache.
  * @param {String} privKey
  * @param {String} password
  * @async
  */
  uploadCustomerPrivateKeyInCache: async function (privKey, password) {
    try {
      privKey = await privKey.text()
      console.log(privKey)
    } catch (err) {
      alert('You have selected NO Private Key!')
      throw err
    }
    try {
      // Used to validate the private Key:
      await openpgp.decryptKey({
        privateKey: await openpgp.readKey({
          armoredKey: privKey,
        }),
        passphrase: password,
      })
    } catch (err) {
      alert('The selected Key is incorrect or the Passphrase is wrong!')
      throw err
    }
    window.localStorage.setItem('privateKeyCustomer', privKey)
    window.localStorage.setItem('privateKeyPasswordCustomer', password)
    alert('Private Key and Passphrase successful locally cached!')
  },
}

/**
 * A variable with functions to get the keys out of the cache
 */
var drusignClientKeys = {
  /**
   * Get the Private Key from the Browser Cache.
   * @returns {String}
   */
  getPrivateKey: function () {
    try {
      let privateKeyArmored = window.localStorage.getItem('privateKey')
      return privateKeyArmored
    } catch (err) {
      alert(
        'No Private Key found! Please upload a Private Key first, before decrypting!',
      )
      throw err
    }
  },

  /**
   * Get the Public Key from the Browser Cache.
   * @returns {String}
   */
  getPublicKey: function () {
    try {
      let publicKeyArmored = window.localStorage.getItem('publicKey')
      return publicKeyArmored
    } catch (err) {
      alert(
        'No Public Key found! Please fetch a Public Key first, before encrypting!',
      )
      throw err
    }
  },

  /**
   * Get the Passphrase from the Browser Cache.
   * @returns {String}
   */
  getPassphrase: function () {
    try {
      let passphrase = window.localStorage.getItem('privateKeyPassword')
      return passphrase
    } catch (err) {
      alert('No Passphrase found!')
      throw err
    }
  },
}


/**
 * A variable with functions to encrypt/decrypt text.
 */
var drusignCrypto = {
  /**
   * Encrypts the given Text.
   * @param {String} unencrypted
   * @returns {Promise<MaybeStream<String>} Encrypted message.
   * @async
   */
  encrypt: async function (unencrypted) {
    const publicKey = await openpgp.readKey({
      armoredKey: drusignClientKeys.getPublicKey(),
    })
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: unencrypted }), // input as Message object
      encryptionKeys: publicKey,
    })
    return encrypted
  },

  /**
   * Decrypts the encrypted object.
   * @param {String} encrypted
   * @returns {Promise<Object>}
   * @async
   */
  decrypt: async function (encrypted) {
    const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readKey({
        armoredKey: drusignClientKeys.getPrivateKey(),
      }),
      passphrase: drusignClientKeys.getPassphrase(),
    })
    let message = await openpgp.readMessage({
      armoredMessage: encrypted, // parse armored message
    })
    try {
      let { data: decrypted } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
      })
      return decrypted
    } catch (err) {
      alert(
        'You are using the wrong Private Key for decrypting your text! Please use the correct one.',
      )
      throw err
    }
  },

  /**
   * Encrypts the given text with the customer mail
   * @param {String} unencrypted
   * @returns {Promise<MaybeStream<String>}
   *    Encrypted message.
   * @async
   */
  encryptCustomer: async function (unencrypted, customerMail) {
    let pubKey = await fetchAndCache.returnFetchPublicKey(customerMail);
    const publicKey = await openpgp.readKey({
      armoredKey: pubKey,
    })
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: unencrypted }), // input as Message object
      encryptionKeys: publicKey,
    })
    return encrypted
  },

  /**
   * Decrypts the text for the customer, fetching the keys from his local storage.
   * @param {String} encrypted
   * @returns {Promise<Object>}
   * @async
   */
  decryptCustomer: async function (encrypted) {
    let privateKeyArmored = window.localStorage.getItem('privateKeyCustomer')
    let passphrase = window.localStorage.getItem('privateKeyPasswordCustomer')
    const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readKey({
        armoredKey: privateKeyArmored,
      }),
      passphrase: passphrase,
    })
    let message = await openpgp.readMessage({
      armoredMessage: encrypted, // parse armored message
    })
    try {
      let { data: decrypted } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
      })
      return decrypted
    } catch (err) {
      alert(
        'You are using the wrong Private Key for decrypting your text! Please use the correct one.',
      )
      throw err
    }
  }
}
