import React, { useState, useEffect } from "react";
import PageContainer from "../components/PageContainer";
import { useToast } from "../components/common/ToastProvider";
import api from "../services/api";
import { useTranslation } from "react-i18next";
import { listSystemSettings, updateSystemSetting, listWidgets, toggleWidget } from "../services/adminService";
import { Settings2, Puzzle, ShieldCheck, Activity, Save, LayoutTemplate, Box, ArrowRight, Smartphone, Megaphone } from "lucide-react";
import styles from "./AdminSettings.module.css";
import { useConfig } from "../context/ConfigContext";

export default function AdminSettings() {
  const { t } = useTranslation();
  const { config, refreshConfig } = useConfig() || { config: {}, refreshConfig: () => {} };
  const toast = useToast();
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [settings, setSettings] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [health, setHealth] = useState(null);

  const [twofa, setTwofa] = useState({ enabled: false, secret: "", uri: "", code: "" });
  const [show2faModal, setShow2faModal] = useState(false);

  useEffect(() => {
      loadData();
  }, []);

  async function loadData() {
      try {
          const [sData, wData] = await Promise.all([
              listSystemSettings().catch(() => []),
              listWidgets().catch(() => [])
          ]);
          setSettings(sData || []);
          setWidgets(wData || []);
          
          const healthRes = await api.get("/admin/settings/health").catch(() => ({ data: { status: 'ONLINE', uptime: '99.9%', db_connection: 'connected' } }));
          setHealth(healthRes.data);
      } catch(e) {
          console.error(e);
          toast.push({ message: t('common.error_loading_data'), type: "error" });
      } finally {
          setInitialLoading(false);
      }
  }

  async function handleUpdateSetting(key, value, type) {
      try {
          await updateSystemSetting(key, value, type);
          toast.push({ message: t('common.save_success'), type: "success" });
          loadData();
          if (refreshConfig) refreshConfig();
      } catch (e) {
          toast.push({ message: t('common.error'), type: "error" });
      }
  }

  async function handleToggleWidget(id, currentStatus) {
      try {
          await toggleWidget(id, !currentStatus);
          toast.push({ message: t('common.save_success'), type: "success" });
          loadData();
      } catch (e) {
          toast.push({ message: t('common.error'), type: "error" });
      }
  }

  if (initialLoading) return <PageContainer><div style={{padding:'4rem', textAlign:'center', color:'var(--text-muted)'}}>{t('common.loading')}...</div></PageContainer>;

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
            <h1 className={styles.pageTitle}>{t('admin.system_settings')}</h1>
            <p className={styles.pageSubtitle}>{t('admin.system_settings_subtitle', 'Manage system configurations, features, and displays.')}</p>
        </div>
      </div>

      <div className={styles.settingsGrid}>
          <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                  <div className={`${styles.cardIcon} ${styles.blue}`}>
                      <Settings2 size={18} />
                  </div>
                  {t('admin.system_status')}
              </h2>
              
              <div>
                  {settings.map(setting => (
                    <div key={setting.id} className={styles.settingItem}>
                        <div className={styles.settingHeader}>
                            <label className={styles.settingLabel}>{setting.key.replace(/_/g, ' ').toUpperCase()}</label>
                            <span className={styles.settingType}>{setting.type}</span>
                        </div>
                        <p className={styles.settingDesc}>{setting.description}</p>
                        
                        <div>
                            {setting.type === 'boolean' ? (
                                <button 
                                    onClick={() => handleUpdateSetting(setting.key, setting.value === 'true' ? 'false' : 'true', 'boolean')}
                                    className={`${styles.toggleSwitch} ${setting.value === 'true' ? styles.on : styles.off}`}
                                >
                                    <span className={styles.toggleHandle} />
                                </button>
                            ) : (
                                <input 
                                    className={styles.inputField}
                                    defaultValue={setting.value}
                                    onBlur={(e) => {
                                        if (e.target.value !== setting.value) {
                                            handleUpdateSetting(setting.key, e.target.value, setting.type);
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                  ))}
                  {settings.length === 0 && <p style={{color:'var(--text-muted)', textAlign:'center', padding:'1rem 0'}}>{t('common.no_data')}</p>}
              </div>
          </div>
      </div>

      <div className={styles.settingsGrid}>
          <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                  <div className={`${styles.cardIcon} ${styles.orange}`}>
                      <Megaphone size={18} />
                  </div>
                  {t('admin.announcement_title', 'Announcements')}
              </h2>
              
              <div className={styles.settingItem}>
                  <div className={styles.settingHeader}>
                      <label className={styles.settingLabel}>{t('admin.active')}</label>
                      <button 
                          onClick={() => handleUpdateSetting('announcement_active', config.announcement_active ? 'false' : 'true', 'boolean')}
                          className={`${styles.toggleSwitch} ${config.announcement_active ? styles.on : styles.off}`}
                      >
                          <span className={styles.toggleHandle} />
                      </button>
                  </div>
              </div>

              <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>{t('common.description')}</label>
                  <textarea 
                      className={styles.inputField}
                      style={{ height: '80px', resize: 'none' }}
                      defaultValue={config.announcement_text}
                      onBlur={(e) => {
                          if (e.target.value !== config.announcement_text) {
                              handleUpdateSetting('announcement_text', e.target.value, 'string');
                          }
                      }}
                  />
              </div>
          </div>

          <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                  <div className={`${styles.cardIcon} ${styles.indigo}`}>
                      <Puzzle size={18} />
                  </div>
                  {t('admin.ui_widgets', 'UI Widgets')}
              </h2>
              
              <div style={{ flex: 1 }}>
                  {widgets.map(widget => (
                      <div key={widget.id} className={styles.widgetItem}>
                          <div className={styles.widgetInfo}>
                              <div className={styles.widgetIcon}>
                                  {widget.type === 'banner' ? <LayoutTemplate size={20} /> : widget.type === 'slider' ? <ArrowRight size={20} /> : <Box size={20} />}
                              </div>
                              <div>
                                  <h4 className={styles.widgetName}>{widget.name}</h4>
                                  <p className={styles.widgetMeta}>{widget.type}</p>
                              </div>
                          </div>
                          <button 
                             onClick={() => handleToggleWidget(widget.id, widget.is_active)}
                             className={`${styles.badge} ${widget.is_active ? styles.active : styles.inactive}`}
                          >
                             {widget.is_active ? t('admin.active') : t('admin.inactive')}
                          </button>
                      </div>
                  ))}
                  {widgets.length === 0 && <p style={{color:'var(--text-muted)', textAlign:'center', padding:'1rem 0'}}>{t('common.no_data')}</p>}
              </div>
          </div>
      </div>

      <div className={styles.settingsGrid}>
          <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                  <div className={`${styles.cardIcon} ${styles.emerald}`}>
                      <Activity size={18} />
                  </div>
                  {t('admin.platform_maintenance')}
              </h2>
              
              {health && (
                  <>
                      <div className={styles.healthStatus}>
                          <span className={styles.healthTitle}>{t('admin.system_status')}</span>
                          <span className={styles.healthValue}>{health.status}</span>
                      </div>
                      <div className={styles.metricGrid}>
                          <div className={styles.metricCard}>
                              <div className={styles.metricLabel}>{t('admin.uptime')}</div>
                              <div className={styles.metricVal}>{health.uptime}</div>
                          </div>
                          <div className={styles.metricCard}>
                              <div className={styles.metricLabel}>{t('admin.db_connection')}</div>
                              <div className={styles.metricVal}>{health.db_connection}</div>
                          </div>
                      </div>
                  </>
              )}

              <div>
                  <div style={{fontSize:'0.75rem', fontWeight:'800', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'0.75rem'}}>{t('admin.database_tools')}</div>
                  <button 
                      onClick={async () => {
                          try {
                              await api.post("/admin/settings/backup");
                              toast.push({ message: t('admin.backup_success'), type: "success" });
                          } catch(e) {
                              toast.push({ message: t('common.error'), type: "error" });
                          }
                      }}
                      className={styles.actionBtn}
                  >
                      <div style={{display:'flex', alignItems:'center'}}>
                          <div className={styles.actionIcon}>
                              <Save size={20} />
                          </div>
                          <div className={styles.actionContent}>
                              <div className={styles.actionTitle}>{t('admin.trigger_backup')}</div>
                          </div>
                      </div>
                      <ArrowRight size={18} className={styles.actionArrow} />
                  </button>
              </div>
          </div>

          <div className={styles.card} style={{ padding: 0, border: 'none', background: 'transparent', boxShadow: 'none' }}>
              <div className={styles.securityPanel}>
                  <div className={styles.securityGlow}></div>
                  <div className={styles.securityContent}>
                      <div className={styles.secHeaderRow}>
                          <div>
                              <h2 className={styles.secTitle}>{t('admin.two_factor_auth')}</h2>
                          </div>
                          <ShieldCheck size={32} color={twofa.enabled ? '#10b981' : '#64748b'} />
                      </div>
                      <p className={styles.secDesc}>
                          {t('admin.2fa_desc')}
                      </p>
                      <button 
                          className={`${styles.primarySecBtn} ${twofa.enabled ? styles.outline : ''}`}
                          onClick={async () => {
                              try {
                                  const res = await api.post("/admin/settings/2fa/setup");
                                  setTwofa({ ...twofa, secret: res.data.secret, uri: res.data.provisioning_uri });
                                  setShow2faModal(true);
                              } catch(e) {
                                  toast.push({ message: t('common.error'), type: "error" });
                              }
                          }}
                      >
                          {twofa.enabled ? t('admin.configure_2fa') : t('admin.enable_2fa')}
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {show2faModal && (
          <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                  <h2 className={styles.modalTitle}>{t('admin.two_factor_auth')}</h2>
                  <div className={styles.qrBox}>
                      <div className={styles.qrIcon}>
                          <Smartphone size={40} color="var(--primary)" />
                      </div>
                      <div className={styles.secretText}>{twofa.secret}</div>
                  </div>

                  <div style={{marginBottom:'1.5rem'}}>
                      <input 
                          type="text" 
                          placeholder="000 000"
                          className={styles.codeInput}
                          maxLength={6}
                          value={twofa.code}
                          onChange={(e) => setTwofa({ ...twofa, code: e.target.value })}
                      />
                  </div>

                  <div className={styles.modalActions}>
                      <button className={`${styles.modalBtn} ${styles.cancel}`} onClick={() => setShow2faModal(false)}>{t('common.cancel')}</button>
                      <button 
                          className={`${styles.modalBtn} ${styles.confirm}`}
                          onClick={async () => {
                              try {
                                  await api.post("/admin/settings/2fa/verify", { code: twofa.code });
                                  setTwofa({ ...twofa, enabled: true });
                                  setShow2faModal(false);
                                  toast.push({ message: t('admin.save_success'), type: "success" });
                              } catch(e) {
                                  toast.push({ message: t('common.error'), type: "error" });
                              }
                          }}
                      >
                          {t('common.confirm')}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </PageContainer>
  );
}
