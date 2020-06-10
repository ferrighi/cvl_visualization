<?php
function cvl_visualization_admin() {
  $form = array();

  //$form['#prefix']  = '<h2>CVL Data Visualization Module configuration</h2>';

  $form['datasets'] = array(
    '#type' => 'textarea',
    '#title' => t('Enter datasets identifier, core and boolean for timeseries (true=dataset is time series)'),
    '#default_value' => variable_get('datasets', ''),
    '#description' => t("datasets identifier and core in the form 'id1|core1|true/false, id2|core2|true/false'"),
  );

  $form['md_prefix'] = array(
    '#type' => 'textfield',
    '#title' => t('Enter metadata prefix'),
    '#default_value' => variable_get('md_prefix', ''),
    '#description' => t("Enter metadata prefix, as for example 'mmd_'"),
    '#required' => TRUE,
  );

  $form['solr_ip'] = array(
    '#type' => 'password',
    '#title' => t('Enter SolR ip'),
    '#default_value' => variable_get('solr_ip', ''),
    '#description' => t("IP of SolR server to be queried"),
    '#required' => TRUE,
  );

  $form['solr_port'] = array(
    '#type' => 'textfield',
    '#title' => t('Enter SolR port'),
    '#default_value' => variable_get('solr_port', ''),
    '#description' => t("Port of SolR server to be queried"),
    '#required' => TRUE,
  );

  $form['ts_ip'] = array(
    '#type' => 'textfield',
    '#title' => t('Enter TS service'),
    '#default_value' => variable_get('ts_ip', ''),
    '#description' => t("Name of the time series service, as ncapi.adc-ncplot.met.no"),
    '#required' => TRUE,
  );

  return system_settings_form($form);
}


