import React, {useState} from 'react';
import {View, TextInput, TouchableOpacity, Text, StyleSheet} from 'react-native';

const ChampVocal = ({valeur, onChangement, placeholder = 'Tapez ou parlez...', nombreLignes = 3, style = {}}) => {
  const [actif, setActif] = useState(false);
  return (
    <View style={[styles.conteneur, style]}>
      <TextInput
        style={[styles.champTexte, actif && styles.champTexteActif]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={valeur}
        onChangeText={onChangement}
        multiline={true}
        numberOfLines={nombreLignes}
        textAlignVertical="top"
        onFocus={() => setActif(true)}
        onBlur={() => setActif(false)}
      />
      <TouchableOpacity style={styles.boutonMicro}>
        <Text style={styles.emojicMicro}>🎤</Text>
        <Text style={styles.texteMicro}>Vocal</Text>
      </TouchableOpacity>
      {actif && (
        <View style={styles.indicateurEcoute}>
          <Text style={styles.texteEcoute}>🎤 Utilisez le micro de votre clavier pour dicter</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  conteneur: {position: 'relative', marginBottom: 15},
  champTexte: {borderWidth: 1, borderColor: '#D1E8F0', borderRadius: 10, padding: 13, paddingRight: 60, fontSize: 14, color: '#1A1A2E', backgroundColor: '#F7FAFC', minHeight: 80, textAlignVertical: 'top'},
  champTexteActif: {borderColor: '#0D7680', borderWidth: 2, backgroundColor: '#E8F4F8'},
  boutonMicro: {position: 'absolute', right: 8, top: 8, backgroundColor: '#0D7680', borderRadius: 20, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', elevation: 3},
  emojicMicro: {fontSize: 16},
  texteMicro: {fontSize: 8, color: '#FFFFFF', fontWeight: 'bold'},
  indicateurEcoute: {marginTop: 5, padding: 8, backgroundColor: '#E8F4F8', borderRadius: 8, alignItems: 'center'},
  texteEcoute: {fontSize: 12, color: '#0D7680', fontWeight: 'bold'},
});

export default ChampVocal;
