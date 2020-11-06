<?php
/*
 *
 * @file
 * Contains \Drupal\cvl_visualization\CvlVisualizationConfigurationForm
 *
 * Form for Landing Page Creator Admin Configuration
 *
 **/
namespace Drupal\cvl_visualization\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Component\Utility\UrlHelper;
use Drupal\Core\Url;
use Drupal\cvl_visualization\SearchUtils;

/*
 *  * Class ConfigurationForm.
 *
 *  {@inheritdoc}
 *
 *   */
class CvlVisualizationConfigurationForm extends ConfigFormBase {

  /*
   * {@inheritdoc}
  */
  protected function getEditableConfigNames() {
    return [
      'cvl_visualization.settings',
      ];
  }

  /*
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'cvl_visualization.admin_config_form';
  }

  /*
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
  $config = $this->config('cvl_visualization.settings');
  //$form['#prefix']  = '<h2>CVL Data Visualization Module configuration</h2>';

  $form['datasets'] = array(
    '#type' => 'textarea',
    '#title' => t('Enter datasets identifier, core and boolean for timeseries (true=dataset is time series)'),
    '#default_value' => $config->get('datasets'),
    '#description' => t("datasets identifier and core in the form 'id1|core1|true/false, id2|core2|true/false'"),
  );


  $form['solr_ip'] = array(
    '#type' => 'password',
    '#title' => t('Enter SolR ip'),
    '#default_value' => $config->get('solr_ip'),
    '#description' => t("IP of SolR server to be queried"),
    '#required' => TRUE,
  );

  $form['solr_port'] = array(
    '#type' => 'textfield',
    '#title' => t('Enter SolR port'),
    '#default_value' => $config->get('solr_port'),
    '#description' => t("Port of SolR server to be queried"),
    '#required' => TRUE,
  );

  $form['solr_core'] = array(
    '#type' => 'textfield',
    '#title' => t('Enter solr core name'),
    '#default_value' => $config->get('solr_core'),
    '#description' => t("Enter name of solr core."),
    '#required' => TRUE,
  );

  $form['ts_ip'] = array(
    '#type' => 'textfield',
    '#title' => t('Enter TS service'),
    '#default_value' => $config->get('ts_ip'),
    '#description' => t("Name of the time series service, as ncapi.adc-ncplot.met.no"),
    '#required' => TRUE,
  );

    return parent::buildForm($form, $form_state);
}
/*
 * {@inheritdoc}
 *
 * NOTE: Implement form validation here
 */
public function validateForm(array &$form, FormStateInterface $form_state) {
  //get user and pass from admin configuration
  $values = $form_state->getValues();

}

/*
 * {@inheritdoc}
 */
public function submitForm(array &$form, FormStateInterface $form_state) {

  /**
   * Save the configuration
  */
  $values = $form_state->getValues();

  $this->configFactory->getEditable('cvl_visualization.settings')

    ->set('datasets', $values['datasets'])
    ->set('solr_core', $values['solr_core'])
    ->set('solr_ip', $values['solr_ip'])
    ->set('solr_port', $values['solr_port'])
    ->set('ts_ip', $values['ts_ip'])

    ->save();

  parent::submitForm($form, $form_state);
}
}
