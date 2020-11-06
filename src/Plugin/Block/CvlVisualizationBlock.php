<?php
/*
 * @file
 * Contains \Drupal\cvl_visualization\Plugin\Block\MapBlock
 *
 * BLock to show search map
 *
 */
namespace Drupal\cvl_visualization\Plugin\Block;

use Drupal\cvl_visualization\HttpConnection_cvl;
use Drupal\cvl_visualization\HeaderList_cvl;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Block\BlockPluginInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Component\Serialization\Json;


/**
 * Provides a Block.
 *
 * @Block(
 *   id = "cvl_visualization_block",
 *   admin_label = @Translation("CVL Visualization"),
 *   category = @Translation("METNO"),
 * )
 * {@inheritdoc}
 */
class CvlVisualizationBlock extends BlockBase implements BlockPluginInterface {

  /**
   * {@inheritdoc}
   * Add js to block and return renderarray
   */
  public function build() {
    \Drupal::logger('cvl_visualization')->debug("Building CVL Visualization Block");
    // Get the module path
    $module_handler = \Drupal::service('module_handler');
    $mpath = $module_handler->getModule('cvl_visualization')->getPath();

    $config = \Drupal::config('cvl_visualization.settings');

    global $base_url;

    $solr_core = $config->get('solr_core');
    $solr_ip = $config->get('solr_ip');
    $solr_port = $config->get('solr_port');
    $ts_ip = $config->get('ts_ip');
    //mmd_pefix is empty string in new mmd and drupal 8. Should be removed from code:
    $md_prefix = '';


    $read_ds = $config->get('datasets');
    $split_ds = array_map('trim', explode(',', $read_ds));
    $datasets = [];

    foreach ($split_ds as $ds) {
      $element = explode('|', $ds);
      $datasets[] = array("id" => $element[0],
                          "core" => $element[1],
                          "ts" => $element[2]);
    }

    //collect data according to core
     foreach ($datasets as $key => $value) {
       if ($value['core'] == 'ADC') {
         $adc_list[] = array($value['id'], $value['ts']);
       }
       elseif ($value['core'] == 'NBS') {
         $nbs_list[] = array($value['id'], $value['ts']);
       }
     }
    //drupal_set_message(print_r($nbs_list,TRUE),'warning');
    //drupal_set_message(print_r($adc_list,TRUE),'warning');

    $data_info = [];
    $query_nbs = '';
    $query_adc = '';

    // Define queries and extract data info
    $fields = [];
    $fields[] = 'id';
    $fields[] = 'personnel_organisation';
    $fields[] = 'project_long_name';
    $fields[] = 'project_short_name';
    $fields[] = 'temporal_extent_start_date';
    $fields[] = 'temporal_extent_end_date';
    $fields[] =' last_metadata_update_datetime';
    $fields[] = 'abstract';
    $fields[] = 'title';
    $fields[] = 'related_url_landing_page';
    $fields[] = 'thumbnail_data';
    $fields[] = 'isParent';
    $fields[] = 'data_access_url_opendap';
    $fields[] = 'feature_type';
    $fields[] = 'ss_access';
    $fields[] = 'data_access_url_http';
    $fields[] = 'data_access_url_odata';
    $fields[] = 'uuid';
    $fields[] = 'score';
    $fields[] = 'hash';
    $fields[] = 'geographic_extent_rectangle_south';
    $fields[] = 'geographic_extent_rectangle_north';
    $fields[] = 'geographic_extent_rectangle_west';
    $fields[] = 'geographic_extent_rectangle_east';
    $fields[] = 'use_constraint';
    $fields[] = 'iso_topic_category';
    $fields[] = 'activity_type';
    $fields[] = 'dataset_production_status';
    $fields[] = 'metadata_status';
    $fields[] = 'data_center_long_name';
    $fields[] = 'data_center_short_name';
    $fields[] = 'data_center_url';
    $fields[] = 'personnel_datacenter_role';
    $fields[] = 'personnel_datacenter_name';
    $fields[] = 'personnel_datacenter_email';
    $fields[] = 'personnel_name';
    $fields[] = 'metadata_identifier';
    $fields[] = 'collection';
    $fields[] = 'keywords_keyword';
    $fields[] = 'platform_ancillary_cloud_coverage';

    $fields_str = implode(',', $fields);
    //$query_adc = 'metadata_identifier:(' . implode(' ', $adc_list) . ')';
    //collect query according to core
    foreach ($adc_list as $value) {
      $query_adc .= ($query_adc == '') ? 'metadata_identifier:"' . $value[0] . '"': ' OR metadata_identifier:"' . $value[0] . '"';
    }
    //foreach ($nbs_list as $value) {
    //  $query_nbs .= ($query_nbs == '') ? 'mmd_metadata_identifier:"' . $value[0] . '"': ' OR mmd_metadata_identifier:"' . $value[0] . '"';
    //}

    $day = (new \DateTime())->modify('-2 day')->format('Y-m-d\TH:i:s\Z');
    $query_nbs = 'temporal_extent_start_date:['.$day.' TO *] AND platform_ancillary_cloud_coverage:[* TO 20]';


    /**
     * TODO: Change from HttpConnection_cvl to Solarium client
     */
     // create a PSR-18 adapter instance
    //  $httpClient = new Http\Adapter\Guzzle6\Client();
    //  $factory = new Nyholm\Psr7\Factory\Psr17Factory();
    //  $adapter = new Solarium\Core\Client\Adapter\Psr18Adapter($httpClient, $factory, $factory);

      // create a client instance
      //$client = new Solarium\Client($adapter, $eventDispatcher, $config);

    // Define connection to SolR for ADC and results of the query
    $adc_l1c = $solr_core;
    $adc_t = 'adc-thumbnail';
    $con_adc = new HttpConnection_cvl($solr_ip, $solr_port);
    //drupal_set_message(print_r($con_adc,'TRUE'),'warning');
    $res_adc = $con_adc->get('/solr/'.$adc_l1c.'/select', array("q" =>$query_adc, "start" => 0, "rows" => 1000, "wt" => "json", "fl" => $fields_str));
    $query_adc_res = Json::decode($res_adc['body'], true);

    // Define connection to SolR for NBS and results of the query
    $nbs_l1c = $solr_core;
    $nbs_t = 'nbs-thumbnail';
    $con_nbs = new HttpConnection_cvl($solr_ip, $solr_port);
    $res_nbs = $con_nbs->get('/solr/'.$nbs_l1c.'/select', array("q" =>$query_nbs, "fq" => "collection:NBS", "start" => 0, "rows" => 1000, "wt" => "json", "fl" => $fields_str));
    $query_nbs_res = Json::decode($res_nbs['body'], true);

    $data_info = [];


    $count = 0;
    foreach ($query_adc_res['response']['docs'] as $doc) {
      $id = $doc['id'];
      $metadata_identifier = $doc[$md_prefix . 'metadata_identifier'];
      $title = $doc[$md_prefix . 'title']['0'];
      $abstract = $doc[$md_prefix . 'abstract']['0'];

      //$address_tot = $doc[$md_prefix . 'data_access_resource'];
      //$dar = cvl_parse_solr_mmd_type_one($address_tot);
      $address_o = isset($doc['data_access_url_opendap']) ? $doc['data_access_url_opendap'] : "";
      $address_w = isset($doc['data_access_url_ogc_wms']) ? $doc['data_access_url_ogc_wms'] : "";
      $address_h = isset($doc['data_access_url_http']) ? $doc['data_access_url_http'] : "";
      $address_od = isset($doc['data_access_url_odata']) ? $doc['data_access_url_odata'] : "";

      //$address_o = Json::decode("{".$address_tot[0]."}",true)['OPeNDAP'];
      //$address_w = Json::decode("{".$address_tot[1]."}",true)['OGC WMS'];
      //$address_h = Json::decode("{".$address_tot[2]."}",true)['HTTP'];
      //$address_od = Json::decode("{".$address_tot[3]."}",true)['ODATA'];

      $north = $doc[$md_prefix . 'geographic_extent_rectangle_north'];
      $south = $doc[$md_prefix . 'geographic_extent_rectangle_south'];
      $east = $doc[$md_prefix . 'geographic_extent_rectangle_east'];
      $west = $doc[$md_prefix . 'geographic_extent_rectangle_west'];
      $latlon = array(($south+$north)/2, ($east+$west)/2);

      $time_start = $doc[$md_prefix . 'temporal_extent_start_date'];
      $time_end = isset($doc[$md_prefix . 'temporal_extent_end_date']) ? $doc[$md_prefix . 'temporal_extent_end_date'] : '-';

      //$fl_thumb = implode(",", array("thumbnail_data", "thumbnail", "base_map"));
      //$con_thumb = new HttpConnection_cvl($solr_ip, $solr_port);
      //$res_thumb = $con_thumb->get('/solr/'.$adc_t.'/select', array("q" => $md_prefix . "metadata_identifier:" . "\"" . $id . "\"", "wt" => "json", "fl" => "$fl_thumb",));
      //$thumb_dec = Json::decode($res_thumb['body'], true);
      $thumbnail_data = isset($doc['thumbnail_data']) ? $doc['thumbnail_data'] : "";

      //if (isset($doc[$md_prefix . 'related_information_resource'])){
      //$related_info = cvl_parse_related_information_resource($doc[$md_prefix . 'related_information_resource']);
      //}
      $related_lp = isset($doc['related_url_landing_page']) ? $doc['related_url_landing_page'] : "";
      //$related_ug = $related_info['Users guide']['uri'];

      $isotopic = isset($doc[$md_prefix . 'iso_topic_category']) ? $doc[$md_prefix . 'iso_topic_category']  : '' ;
      $keywords = isset($doc[$md_prefix . 'keywords_keyword'])? $doc[$md_prefix . 'keywords_keyword'] : '' ;
      $collection = isset($doc[$md_prefix . 'collection']) ? $doc[$md_prefix . 'collection'] : '' ;
      $activity = isset($doc[$md_prefix . 'activity_type']) ? $doc[$md_prefix . 'activity_type'] : '' ;

      $ds_prod_status = isset($doc[$md_prefix . 'dataset_production_status']) ? $doc[$md_prefix . 'dataset_production_status'] : '' ;
      $md_status = isset($doc[$md_prefix . 'metadata_status']) ? $doc[$md_prefix . 'metadata_status'] : '' ;
      $last_md_update = isset($doc[$md_prefix . 'last_metadata_update_datetime']) ? $doc[$md_prefix . 'last_metadata_update_datetime'] : '';


      $dc_sh =  isset($doc[$md_prefix . 'data_center_short_name']) ? $doc[$md_prefix . 'data_center_short_name'] : '';
      $dc_ln =  isset($doc[$md_prefix . 'data_center_long_name']) ? $doc[$md_prefix . 'data_center_long_name'] : '';
      $dc_url = isset($doc[$md_prefix . 'data_center_url']) ? $doc[$md_prefix . 'data_center_url'] : '';
      $dc_cr =  isset($doc[$md_prefix . 'personnel_datacenter_role']) ? $doc[$md_prefix . 'personnel_datacenter_role'] : '';
      $dc_cn =  isset($doc[$md_prefix . 'personnel_datacenter_name']) ? $doc[$md_prefix . 'personnel_datacenter_name'] : '';
      $dc_ce =  isset($doc[$md_prefix . 'personnel_datacenter_email']) ? $doc[$md_prefix . 'personnel_datacenter_email'] : '';


      $cit_cr =  isset($doc[$md_prefix . 'dataset_citation_author']) ? $doc[$md_prefix . 'dataset_citation_author'] : '';
      $cit_tit =  isset($doc[$md_prefix . 'dataset_citation_title']) ? $doc[$md_prefix . 'dataset_citation_title'] : '';
      $cit_date =  isset($doc[$md_prefix . 'dataset_citation_publication_date']) ? $doc[$md_prefix . 'dataset_citation_publication_date'] : '';
      $cit_place =  isset($doc[$md_prefix . 'dataset_citation_publication_place']) ? $doc[$md_prefix . 'dataset_citation_publication_place'] : '';
      $cit_publisher =  isset($doc[$md_prefix . 'dataset_citation_publisher']) ? $doc[$md_prefix . 'dataset_citation_publisher'] : '';

      $access_const =  isset($doc[$md_prefix . 'access_constraint']) ? $doc[$md_prefix . 'access_constraint'] : 'Unspecified';
      $use_const =  isset($doc[$md_prefix . 'use_constraint'])? $doc[$md_prefix . 'use_constraint'] : 'Unspecified';

      foreach ($adc_list as $el) {
        if ($el[0] === $metadata_identifier){
           $ts = $el[1];
         }
      }

      $data_info[$count] = array(array($address_o,$address_w,$address_h,$address_od),
                                 $id,
                                 array($north,$south,$east,$west),
                                 $latlon,
                                 $title,
                                 $abstract,
                                 array($time_start, $time_end),
                                 $thumbnail_data,
                                 array($related_lp),
                                 array($isotopic, $keywords, $collection, $activity),
                                 array($ds_prod_status, $md_status, $last_md_update),
                                 array($dc_sh, $dc_ln, $dc_url, $dc_cr, $dc_cn, $dc_ce),
                                 array($cit_cr, $cit_tit, $cit_date, $cit_place, $cit_publisher),
                                 $ts,
                                 array($access_const, $use_const),
                                 $adc_l1c);

      $count = $count + 1;
   }

    foreach ($query_nbs_res['response']['docs'] as $doc) {
      $id = $doc['id'];
      $title = $doc[$md_prefix . 'title']['0'];
      $abstract = $doc[$md_prefix . 'abstract']['0'];
      /*
      $address_tot = $doc[$md_prefix . 'data_access_resource'];
      $dar = cvl_parse_solr_mmd_type_one($address_tot);
      $address_o = $dar['"OPeNDAP"'];
      $address_w = $dar['"OGC WMS"'];
      $address_h = $dar['"HTTP"'];
      $address_od = $dar['"ODATA"'];
      */
      $address_o = isset($doc['data_access_url_opendap']) ? $doc['data_access_url_opendap'] : "";
      $address_w = isset($doc['data_access_url_ogc_wms']) ? $doc['data_access_url_ogc_wms'] : "";
      $address_h = isset($doc['data_access_url_http']) ? $doc['data_access_url_http'] : "";
      $address_od = isset($doc['data_access_url_odata']) ? $doc['data_access_url_odata'] : "";

      $north = $doc[$md_prefix . 'geographic_extent_rectangle_north'];
      $south = $doc[$md_prefix . 'geographic_extent_rectangle_south'];
      $east = $doc[$md_prefix . 'geographic_extent_rectangle_east'];
      $west = $doc[$md_prefix . 'geographic_extent_rectangle_west'];
      $latlon = array(($south+$north)/2, ($east+$west)/2);

      $time_start = $doc[$md_prefix . 'temporal_extent_start_date'];
      $time_end = $doc[$md_prefix . 'temporal_extent_end_date'];

      //$fl_thumb = implode(",", array("thumbnail_data", "thumbnail", "base_map"));
      $thumbnail_data = $doc['thumbnail_data'];
      /*
      $con_thumb = new HttpConnection_cvl($solr_ip, $solr_port);
      $res_thumb = $con_thumb->get('/solr/'.$nbs_t.'/select', array("q" => $md_prefix . "metadata_identifier:" . "\"" . $id . "\"", "wt" => "json", "fl" => "$fl_thumb",));
      $thumb_dec = Json::decode($res_thumb['body'], true);
      $thumbnail_data = $thumb_dec['response']['docs'][0]['thumbnail_data'];
      */
      /*
      $related_info = cvl_parse_related_information_resource($doc[$md_prefix . 'related_information_resource']);
      $related_lp = $related_info['Dataset landing page']['uri'];
      */
      $related_lp = $doc['related_url_landing_page'];
      //$related_ug = $related_info['Users guide']['uri'];

      $isotopic = isset($doc[$md_prefix . 'iso_topic_category']) ? $doc[$md_prefix . 'iso_topic_category']  : '' ;
      $keywords = isset($doc[$md_prefix . 'keywords_keyword'])? $doc[$md_prefix . 'keywords_keyword'] : '' ;
      $collection = isset($doc[$md_prefix . 'collection']) ? $doc[$md_prefix . 'collection'] : '' ;
      $activity = isset($doc[$md_prefix . 'activity_type']) ? $doc[$md_prefix . 'activity_type'] : '' ;

      $ds_prod_status = isset($doc[$md_prefix . 'dataset_production_status']) ? $doc[$md_prefix . 'dataset_production_status'] : '' ;
      $md_status = isset($doc[$md_prefix . 'metadata_status']) ? $doc[$md_prefix . 'metadata_status'] : '' ;
      $last_md_update = isset($doc[$md_prefix . 'last_metadata_update_datetime']) ? $doc[$md_prefix . 'last_metadata_update_datetime'] : '';



      $dc_sh =  isset($doc[$md_prefix . 'data_center_short_name']) ? $doc[$md_prefix . 'data_center_short_name'] : '';
      $dc_ln =  isset($doc[$md_prefix . 'data_center_long_name']) ? $doc[$md_prefix . 'data_center_long_name'] : '';
      $dc_url = isset($doc[$md_prefix . 'data_center_url']) ? $doc[$md_prefix . 'data_center_url'] : '';
      $dc_cr =  isset($doc[$md_prefix . 'personnel_datacenter_role']) ? $doc[$md_prefix . 'personnel_datacenter_role'] : '';
      $dc_cn =  isset($doc[$md_prefix . 'personnel_datacenter_name']) ? $doc[$md_prefix . 'personnel_datacenter_name'] : '';
      $dc_ce =  isset($doc[$md_prefix . 'personnel_datacenter_email']) ? $doc[$md_prefix . 'personnel_datacenter_email'] : '';


      $cit_cr =  isset($doc[$md_prefix . 'dataset_citation_author']) ? $doc[$md_prefix . 'dataset_citation_author'] : '';
      $cit_tit =  isset($doc[$md_prefix . 'dataset_citation_title']) ? $doc[$md_prefix . 'dataset_citation_title'] : '';
      $cit_date =  isset($doc[$md_prefix . 'dataset_citation_publication_date']) ? $doc[$md_prefix . 'dataset_citation_publication_date'] : '';
      $cit_place =  isset($doc[$md_prefix . 'dataset_citation_publication_place']) ? $doc[$md_prefix . 'dataset_citation_publication_place'] : '';
      $cit_publisher =  isset($doc[$md_prefix . 'dataset_citation_publisher']) ? $doc[$md_prefix . 'dataset_citation_publisher'] : '';


      $access_const =  isset($doc[$md_prefix . 'access_constraint']) ? $doc[$md_prefix . 'access_constraint'] : 'Unspecified';
      $use_const =  isset($doc[$md_prefix . 'use_constraint'])? $doc[$md_prefix . 'use_constraint'] : 'Unspecified';
      //drupal_set_message(print_r($access_const,'TRUE'),'warning');

      $ts = 'false';

      $data_info[$count] = array(array($address_o,$address_w,$address_h,$address_od),
                                 $id,
                                 array($north,$south,$east,$west),
                                 $latlon,
                                 $title,
                                 $abstract,
                                 array($time_start, $time_end),
                                 $thumbnail_data,
                                 array($related_lp),
                                 array($isotopic, $keywords, $collection, $activity),
                                 array($ds_prod_status, $md_status, $last_md_update),
                                 array($dc_sh, $dc_ln, $dc_url, $dc_cr, $dc_cn, $dc_ce),
                                 array($cit_cr, $cit_tit, $cit_date, $cit_place, $cit_publisher),
                                 $ts,
                                 array($access_const, $use_const),
                                 $nbs_l1c);

      $count = $count + 1;
   }


    Json::encode($data_info);

    $build['map-res-popup'] = [
      '#markup' => '<div id="popup" class="ol-popup"><div id="popup-content"></div></div>',
    ];
   // search-map wrapper
    $build['search-map'] = [
      '#prefix' => '<div id="map-cvl" class="map-cvl w3-container">',
      '#suffix' => '</div>'
    ];

    $build['search-map']['projection'] = [
      '#type' => 'markup',
      '#markup' => '<div class="proj-wrapper"><label class="proj-label">Select Projection</label></div>',
      '#allowed_tags' => ['div','label'],
  ];

      $build['#attached'] = [
        'library' => [
          'cvl_visualization/cvl'
        ],
        'drupalSettings' => [
          'cvl_visualization' => [
            'extracted_info' => $data_info,
            'pins' => 'TRUE',
            'ts_ip' => $ts_ip,
            'path' => $mpath,
            'site_name' => $base_url,
          ],
        ],
    ];
  return $build;
  }
}
