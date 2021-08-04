<?php

namespace Drupal\drusign\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Class KeyForm
 *
 * The Form for receiving your public/private keypair.
 *
 * @package Drupal\drusign\Form
 */
class KeyForm extends FormBase {

  /**
   * Get the Form id of this specific Form.
   *
   * @return string
   */
  public function getFormId() {
    return 'drusign_key_form';
   }

  /**
   * {@inheritdoc}
   *
   * @return array
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    // Attaching javascript 'initAcceptContract':
    $form['#attached']['library'][] = 'drusign/initGetKeys';

    $form['fetchPubWrapper'] = [
      '#type' => 'details',
      '#open' => TRUE,
      '#title' => $this->t('Fetch Your Public Key'),
      '#description' => $this->t('Your Key will be fetched from "keys.openpgp.org" and loaded in your Browsers local storage.<br/>Please provide your Public Key on "key.openpgp.org".')
    ];

    $form['fetchPubWrapper']['fetchPubMailField'] = [
      '#type' => 'email',
      '#id' => 'mailField',
      '#title' => $this->t('Please Enter your E-Mail Adress to fetch your public Key')
    ];

    $form['fetchPubWrapper']['fetchPubSubmit'] = [
      '#type' => 'submit',
      '#id' => 'fetchPubSubmit',
      '#value' => $this->t('Fetch your Public Key'),
    ];

    $form['uploadPrivWrapper'] = [
      '#type' => 'details',
      '#open' => TRUE,
      '#title' => $this->t('Upload your Private Key'),
      '#description' => $this->t('You can upload your private Key in this section.</br><strong>NOTE: Your Key will be uploaded in the local Storage of your Browser, it will NOT get uploaded on any Database or Cloud and therefore, it will NOT get compromised!!</strong>')
    ];

    $form['uploadPrivWrapper']['privFileUpload'] = [
      '#type' => 'file',
      '#id' => 'privFileUpload',
    ];

    $form['uploadPrivWrapper']['privFileSubmit'] = [
      '#type' => 'submit',
      '#id' => 'uploadKey',
      '#value' => $this->t(
        'Upload Private Key')
    ];
    return $form;
   }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    //Nothing to do here, Form uses mainly javascript for submissions.
   }

}
