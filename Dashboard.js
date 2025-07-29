import React, { useCallback, useState } from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import {
  Button,
  Flex,
  Card,
  WhiteSpace,
  WingBlank,
} from '@ant-design/react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowDown, faArrowUp, faSchool } from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, ENTREE, ENTREE_BUS, SORTIE, SORTIE_BUS } from '../../consts/consts';
import 'react-native-url-polyfill/auto';
import { useFocusEffect } from '@react-navigation/core';
import ScanEntree from '../scanPage/ScanEntree';
import ScanSortie from '../scanPage/ScanSortie';
import ScanEleve from '../scanPage/ScanEleve';
import ScanProf from '../scanPage/ScanProf';
import { ApiClient } from '../../utils/apiClient';
import styles from './Dashboard.Style';


const Dashboard = ({ navigation }) => {
  const [authorities, setAuthorities] = useState('');
  const [elevesAbsents, setElevesAbsents] = useState(0);
  const [elevesPresents, setElevesPresents] = useState(0);
  const [ecoleName, setEcoleName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const hasRole = roles => roles.includes(authorities);

  const getDashboardData = async (ecoleId, anneeScolaireId) => {
    try {
      const { data } = await ApiClient.get(`${BASE_URL}dashboard/${ecoleId}?anneeScolaireId=${anneeScolaireId}`);

      setElevesAbsents(data.eleveAbsents);
      setElevesPresents(data.elevePresents);
    } catch (error) {
      console.warn('Erreur récupération dashboard :', error?.message);
    }
  };

  const getMultiple = async () => {
    try {
      setRefreshing(true);
      const keys = ['authorities', 'ecoleId', 'anneeScolaireId'];
      const values = await AsyncStorage.multiGet(keys);
      const data = Object.fromEntries(values);

      setAuthorities(data.authorities);
      const { ecoleId, anneeScolaireId } = data;

      if (ecoleId && anneeScolaireId) {
        await getDashboardData(ecoleId, anneeScolaireId);
        await getEcole(ecoleId);
      }
    } catch (e) {
      console.warn('Erreur AsyncStorage:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const getEcole = async (ecoleId) => {
    try {
      const { data } = await ApiClient.get(`${BASE_URL}ecoles/${ecoleId}`);
      setEcoleName(data.nom);
    } catch (error) {
      console.warn('Erreur récupération dashboard :', error?.message);
    }
  };

  useFocusEffect(useCallback(() => {
    getMultiple();
  }, []));

  const navigateToScan = (title, scanType, onReadFn, pointageType = null, showAlert = false) => {
    navigation.navigate('ScanStackScreen', {
      screen: scanType === 'beginCourse' ? 'ScanPointage' : 'ScanScreen',
      params: {
        screen: 'NFC',
        title,
        params: { scanType, onRead: onReadFn, pointageType, showAlert },
      },
    });
  };

  const onScanEleve = useCallback(async tag => {
    if (!tag) return;
    const res = await ScanEleve(tag);
    if (res) {
      navigation.navigate('ScanStackScreen', {
        screen: 'StudentDetailsScreen',
        params: { eleve: res.data },
      });
    }
  }, [navigation]);

  const onScanProf = useCallback(async tag => {
    if (!tag) return;
    const res = await ScanProf(tag);
    if (res) {
      navigation.navigate('ScanStackScreen', {
        screen: 'TeacherDetailsScreen',
        params: { professeur: res.data },
      });
    }
  }, [navigation]);

  const ActionButton = ({ title, image, onPress }) => (
    <Flex.Item style={styles.flexItem}>
      <TouchableOpacity style={styles.touchable} onPress={onPress}>
        <View style={styles.cardContent}>
          <Image style={styles.icon} source={image} />
          <Text style={styles.textCenter}>{title}</Text>
        </View>
      </TouchableOpacity>
    </Flex.Item>
  );

  const buttonEcoleView = () => (
    <>
      <Flex style={styles.statRow}>
        <Flex.Item>
          <Card>
            <Card.Body>
              <View style={styles.statContainer}>
                <View style={styles.statBlock}>
                  <View style={styles.statValue}>
                    <FontAwesomeIcon icon={faArrowDown} size={24} color="green" />
                    <Text style={styles.statNumber}>{elevesPresents}</Text>
                  </View>
                  <Text style={styles.statLabel}>PRÉSENTS</Text>
                </View>
                <View style={styles.statBlock}>
                  <View style={styles.statValue}>
                    <Text style={styles.statNumber}>{elevesAbsents}</Text>
                    <FontAwesomeIcon icon={faArrowUp} size={24} color="red" />
                  </View>
                  <Text style={styles.statLabel}>ABSENTS</Text>
                </View>
              </View>
            </Card.Body>
          </Card>
        </Flex.Item>
      </Flex>
      <WhiteSpace size="lg" />
      <Flex wrap="wrap">
        <ActionButton
          title="Pointage Entrée"
          image={require('../../assets/images/check-in.png')}
          onPress={() => navigateToScan('Pointage Entrées', 'pointage', ScanEntree, ENTREE, true)}
        />
        <ActionButton
          title="Pointage Sortie"
          image={require('../../assets/images/check-out.png')}
          onPress={() => navigateToScan('Pointage Sorties', 'pointage', ScanSortie, SORTIE, true)}
        />
      </Flex>

      <WhiteSpace size="lg" />
      <Flex wrap="wrap">
        <ActionButton
          title="Scanner Élève"
          image={require('../../assets/images/face-detection.png')}
          onPress={() => navigateToScan('Scanner un élève', 'scan', onScanEleve)}
        />
        <ActionButton
          title="Démarrer cours"
          image={require('../../assets/images/stopwatch.png')}
          onPress={() => navigateToScan('Démarrer un cours', 'beginCourse', onScanProf)}
        />
      </Flex>

      <WhiteSpace size="lg" />
    </>
  );

  const buttonBusView = () => (
    <>
      <WhiteSpace size="lg" />
      <Flex justify="center">
        <Flex.Item style={styles.flexItem}>
          <Card style={styles.cardSchool}>
            <View style={styles.statContainer}>
              <View style={[styles.ecoleRow, { justifyContent: 'center', alignItems: 'center' }]}>
                <FontAwesomeIcon icon={faSchool} size={28} color="#F59E00" />
                <Text style={styles.ecoleName}>{ecoleName}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'green' }}>{elevesPresents}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>Élèves présents</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'red' }}>{elevesAbsents}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>Élèves absents</Text>
                </View>
              </View>
            </View>
          </Card>
        </Flex.Item>
      </Flex>

      <WhiteSpace size="lg" />
      <Flex wrap="wrap">
        <ActionButton
          title="Entrée Bus"
          image={require('../../assets/images/bus.png')}
          onPress={() => navigateToScan('Entrée Bus', 'pointage', ScanEntree, ENTREE_BUS, true)}
        />
      </Flex>
      <WhiteSpace size="lg" />

      <Flex wrap="wrap">
        <ActionButton
          title="Sortie Bus"
          image={require('../../assets/images/bus_sortie.png')}
          onPress={() => navigateToScan('Sorties Bus', 'pointage', ScanSortie, SORTIE_BUS, true)}
        />
      </Flex>
      <WhiteSpace size="lg" />
    </>
  );

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={getMultiple} />}>
      <WingBlank>
        {!authorities ? (
          <View style={{ padding: 30, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#F59E00" />
          </View>
        ) : (
          <>
            {hasRole(['ROLE_DIRECTEUR', 'ROLE_DIRECTEUR_ETUDE', 'ROLE_SURVEILLANT', 'ROLE_SURVEILLANT_GENERAL'])
              ? buttonEcoleView()
              : buttonBusView()}

            {hasRole(['ROLE_DIRECTEUR', 'ROLE_DIRECTEUR_ETUDE']) && (
              <Flex>
                <Flex.Item>
                  <Button
                    onPress={() => navigation.navigate('OptionsScreen')}
                    size="large"
                    style={styles.optionButton}>
                    Options
                  </Button>
                </Flex.Item>
              </Flex>
            )}
          </>
        )}
      </WingBlank>
    </ScrollView>
  );
};

export default Dashboard;