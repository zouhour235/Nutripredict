import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  historiquePatient,
  historiqueUtilisateur,
  supprimerDiagnostic,
} from '../services/api';

const EcranHistorique = ({navigation}) => {
  const [chargement, setChargement] = useState(true);
  const [historique, setHistorique] = useState([]);
  const [patientId, setPatientId] = useState(null);
  const [erreur, setErreur] = useState('');
  const [suppressionId, setSuppressionId] = useState(null);

  const chargerHistorique = useCallback(async () => {
    setChargement(true);
    setErreur('');

    try {
      const mode = await AsyncStorage.getItem('nutripredict_mode');

      let donnees = {
        patient_id: null,
        historique: [],
      };

      if (mode === 'compte') {
        const utilisateurId = await AsyncStorage.getItem(
          'nutripredict_utilisateur_id',
        );

        if (
          !utilisateurId ||
          !Number.isInteger(Number(utilisateurId))
        ) {
          throw new Error(
            'Identifiant du compte absent. Veuillez vous reconnecter.',
          );
        }

        donnees = await historiqueUtilisateur(
          Number(utilisateurId),
        );
      } else {
        // Le mode anonyme ne lit que le patient anonyme enregistré localement.
        const idAnonyme = await AsyncStorage.getItem(
          'nutripredict_patient_id',
        );

        if (!idAnonyme || !Number.isInteger(Number(idAnonyme))) {
          setPatientId(null);
          setHistorique([]);
          return;
        }

        donnees = await historiquePatient(Number(idAnonyme));
      }

      setPatientId(donnees.patient_id ?? null);
      setHistorique(
        Array.isArray(donnees.historique) ? donnees.historique : [],
      );
    } catch (e) {
      console.error('Erreur chargement historique :', e);
      setErreur(
        e?.response?.data?.detail ||
        e?.message ||
        'Impossible de charger votre historique.',
      );
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      chargerHistorique();
    }, [chargerHistorique]),
  );

  const confirmerSuppression = item => {
    if (!patientId) {
      Alert.alert(
        'Suppression impossible',
        'Le patient associé à ce diagnostic est introuvable.',
      );
      return;
    }

    Alert.alert(
      'Supprimer ce diagnostic ?',
      'Cette suppression sera définitive et retirera ce résultat de votre historique.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setSuppressionId(item.id);

            try {
              await supprimerDiagnostic(patientId, item.id);
              setHistorique(liste =>
                liste.filter(diagnostic => diagnostic.id !== item.id),
              );
              Alert.alert('Succès', 'Le diagnostic a été supprimé.');
            } catch (e) {
              Alert.alert(
                'Erreur',
                e?.response?.data?.detail ||
                'Impossible de supprimer ce diagnostic. Réessayez.',
              );
            } finally {
              setSuppressionId(null);
            }
          },
        },
      ],
    );
  };

  const couleurGravite = gravite => {
    const valeur = String(gravite || '').toLowerCase();

    if (valeur.includes('sévère') || valeur.includes('severe')) {
      return '#DC2626';
    }
    if (valeur.includes('modér') || valeur.includes('moder')) {
      return '#D97706';
    }
    if (valeur.includes('légère') || valeur.includes('legere')) {
      return '#16A34A';
    }
    return '#0D7680';
  };

  const iconeType = type => {
    switch (String(type || '').toLowerCase()) {
      case 'symptomes':
      case 'symptômes':
        return '🩺';
      case 'biologique':
        return '🔬';
      case 'image':
        return '📸';
      default:
        return '⚕️';
    }
  };

  const nomType = type => {
    switch (String(type || '').toLowerCase()) {
      case 'symptomes':
      case 'symptômes':
        return 'Symptômes';
      case 'biologique':
        return 'Biologique';
      case 'image':
        return 'Image';
      default:
        return 'Diagnostic';
    }
  };

  const iconeResultat = resultat => {
    const texte = String(resultat || '').toLowerCase();

    if (texte.includes('normal')) return '✅';
    if (texte.includes('fer') || texte.includes('anémie') ||
        texte.includes('anemie')) return '🩸';
    if (texte.includes('vitamine a')) return '👁️';
    if (texte.includes('calcium')) return '🦴';
    return '⚕️';
  };

  const formaterDate = date => {
    if (!date) return 'Date inconnue';

    const valeur = new Date(date);
    if (Number.isNaN(valeur.getTime())) {
      return String(date);
    }

    return valeur.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const estNormal = resultat =>
    String(resultat || '').trim().toLowerCase() === 'normal';

  if (chargement) {
    return (
      <View style={styles.chargementConteneur}>
        <ActivityIndicator size="large" color="#0D7680" />
        <Text style={styles.texteChargement}>
          Chargement de vos diagnostics...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.conteneur}>
      <View style={styles.entete}>
        <Text style={styles.titre}>📋 Mes Diagnostics</Text>
        <Text style={styles.sousTitre}>
          Historique de vos consultations NutriPredict
        </Text>
      </View>

      {erreur !== '' && (
        <View style={styles.erreurConteneur}>
          <Text style={styles.texteErreur}>{erreur}</Text>
          <TouchableOpacity
            style={styles.boutonReessayer}
            onPress={chargerHistorique}>
            <Text style={styles.texteBoutonReessayer}>
              Réessayer
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsConteneur}>
        <View style={styles.stateCarte}>
          <Text style={styles.statNombre}>{historique.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.stateCarte}>
          <Text style={[styles.statNombre, {color: '#DC2626'}]}>
            {historique.filter(
              h => String(h.gravite || '').toLowerCase().includes('sévère') ||
                   String(h.gravite || '').toLowerCase().includes('severe'),
            ).length}
          </Text>
          <Text style={styles.statLabel}>Sévères</Text>
        </View>

        <View style={styles.stateCarte}>
          <Text style={[styles.statNombre, {color: '#D97706'}]}>
            {historique.filter(
              h => String(h.gravite || '').toLowerCase().includes('modér') ||
                   String(h.gravite || '').toLowerCase().includes('moder'),
            ).length}
          </Text>
          <Text style={styles.statLabel}>Modérées</Text>
        </View>

        <View style={styles.stateCarte}>
          <Text style={[styles.statNombre, {color: '#16A34A'}]}>
            {historique.filter(h => estNormal(h.resultat)).length}
          </Text>
          <Text style={styles.statLabel}>Normaux</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.titreSection}>
          Tous vos diagnostics
        </Text>

        {historique.length === 0 ? (
          <View style={styles.videConteneur}>
            <Text style={styles.texteVide}>
              {erreur
                ? 'Historique indisponible'
                : 'Aucun diagnostic enregistré'}
            </Text>
            <Text style={styles.sousTitreVide}>
              {erreur
                ? 'Vérifiez la connexion au serveur puis réessayez.'
                : 'Vos résultats apparaîtront ici après un diagnostic.'}
            </Text>

            <TouchableOpacity
              style={styles.boutonCommencer}
              onPress={() => {
                if (erreur) {
                  chargerHistorique();
                } else {
                  navigation.navigate('Accueil');
                }
              }}>
              <Text style={styles.texteBoutonCommencer}>
                {erreur ? 'Réessayer' : 'Commencer'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          historique.map(item => (
            <View key={String(item.id)} style={styles.carteDiagnostic}>
              <View style={styles.enteteCarte}>
                <View style={styles.ligneType}>
                  <Text style={styles.iconeType}>
                    {iconeType(item.type)}
                  </Text>
                  <Text style={styles.nomType}>
                    {nomType(item.type)}
                  </Text>
                </View>
                <Text style={styles.date}>
                  {formaterDate(item.date)}
                </Text>
              </View>

              <View style={styles.ligneResultat}>
                <Text style={styles.iconeResultat}>
                  {iconeResultat(item.resultat)}
                </Text>
                <Text style={styles.texteResultat}>
                  {item.resultat || 'Résultat non renseigné'}
                </Text>
              </View>

              <View style={styles.piedCarte}>
                <View
                  style={[
                    styles.badgeGravite,
                    {backgroundColor: couleurGravite(item.gravite)},
                  ]}>
                  <Text style={styles.texteGravite}>
                    {item.gravite || 'Non précisée'}
                  </Text>
                </View>

                {item.probabilite != null && (
                  <Text style={styles.probabilite}>
                    Confiance : {item.probabilite}%
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.boutonSupprimer,
                  suppressionId === item.id && styles.boutonDesactive,
                ]}
                disabled={suppressionId === item.id}
                onPress={() => confirmerSuppression(item)}>
                {suppressionId === item.id ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Text style={styles.texteBoutonSupprimer}>
                    🗑️ Supprimer ce diagnostic
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.boutonNouveau}
          onPress={() => navigation.navigate('Accueil')}>
          <Text style={styles.texteBoutonNouveau}>
            🔍 Nouveau diagnostic
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{height: 30}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  conteneur: {flex: 1, backgroundColor: '#FFFFFF'},
  chargementConteneur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  texteChargement: {marginTop: 15, fontSize: 14, color: '#0D7680'},
  entete: {backgroundColor: '#0D7680', padding: 20},
  titre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  sousTitre: {fontSize: 12, color: '#E0F7F8'},
  statsConteneur: {flexDirection: 'row', padding: 15, gap: 10},
  stateCarte: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F4F8',
    elevation: 1,
  },
  statNombre: {fontSize: 24, fontWeight: 'bold', color: '#0D7680'},
  statLabel: {fontSize: 11, color: '#64748B', marginTop: 3},
  section: {padding: 15},
  titreSection: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14295A',
    marginBottom: 12,
  },
  carteDiagnostic: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F4F8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  enteteCarte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  ligneType: {flexDirection: 'row', alignItems: 'center'},
  iconeType: {fontSize: 18, marginRight: 6},
  nomType: {fontSize: 13, fontWeight: 'bold', color: '#0D7680'},
  date: {fontSize: 11, color: '#64748B', flexShrink: 1},
  ligneResultat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconeResultat: {fontSize: 20, marginRight: 8},
  texteResultat: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#14295A',
    flex: 1,
  },
  piedCarte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeGravite: {borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4},
  texteGravite: {color: '#FFFFFF', fontSize: 12, fontWeight: 'bold'},
  probabilite: {fontSize: 12, color: '#64748B'},
  boutonSupprimer: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    backgroundColor: '#FFF7F7',
  },
  boutonDesactive: {opacity: 0.6},
  texteBoutonSupprimer: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: 'bold',
  },
  videConteneur: {alignItems: 'center', padding: 40},
  texteVide: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14295A',
    marginBottom: 8,
    textAlign: 'center',
  },
  sousTitreVide: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  boutonCommencer: {
    backgroundColor: '#0D7680',
    borderRadius: 10,
    padding: 12,
    paddingHorizontal: 25,
  },
  texteBoutonCommencer: {color: '#FFFFFF', fontWeight: 'bold'},
  boutonNouveau: {
    backgroundColor: '#0D7680',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
  },
  texteBoutonNouveau: {color: '#FFFFFF', fontSize: 16, fontWeight: 'bold'},
  erreurConteneur: {
    margin: 15,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  texteErreur: {fontSize: 13, color: '#991B1B'},
  boutonReessayer: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  texteBoutonReessayer: {fontSize: 13, color: '#991B1B', fontWeight: 'bold'},
});

export default EcranHistorique;
