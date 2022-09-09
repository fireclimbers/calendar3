/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useState, useRef, useEffect } from 'react';
import type {Node} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  TextInput
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faXmark, faClock, faTrashCan, faPlus, faChevronRight, faChevronLeft, faCheck, faAppleWhole, faDumbbell, faPersonRunning } from '@fortawesome/free-solid-svg-icons';

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
const FoodModal = ({modalVisible, setModalVisible, foodItem, onChangeFoodItem, cals, onChangeCals, qty, onChangeQty, eaten, onChangeEaten, saveItem}): Node => {
  const foodInput = useRef(null);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onShow={() => setTimeout(() => foodInput.current.focus(), 100)}
      onRequestClose={() => setModalVisible(!modalVisible)}
    >
      <Pressable style={styles.modalBackground} onPress={() => setModalVisible(!modalVisible)}>
        <View
          style={styles.modalView}
          onStartShouldSetResponder={(event) => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <TextInput
            style={[styles.input,{width:'100%'}]}
            onChangeText={onChangeFoodItem}
            value={foodItem}
            placeholder="Enter food"
            ref={foodInput}
          />
          <View style={{flexDirection:'row'}}>
            <TextInput
              style={[styles.input,{flex:3}]}
              onChangeText={onChangeCals}
              value={cals}
              placeholder="Enter cals"
              keyboardType="numeric"
            />
            <FontAwesomeIcon style={{marginTop:'auto',marginBottom:'auto',marginLeft:6,marginRight:6,color:'black'}} icon={faXmark} size={18} />
            <TextInput
              style={[styles.input,{flex:1}]}
              onChangeText={onChangeQty}
              value={qty}
              keyboardType="numeric"
            />
            <Pressable onPress={() => onChangeEaten(!eaten)} style={[styles.circleButton,{backgroundColor:eaten ? colors.eaten : colors.pending,marginTop:'auto',marginBottom:'auto',marginLeft:18}]}><FontAwesomeIcon style={styles.circleButtonIcon} icon={eaten ? faCheck : faClock} size={styles.circleButtonIcon.fontSize} /></Pressable>
          </View>
          <Pressable
            onPress={saveItem}
            style={{backgroundColor:colors.good,padding:9,borderRadius:3,marginTop:24}}
          >
            <Text style={{fontSize:16,color:'white'}}>Save</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const dateToStr = (d) => {
  const year = d.getFullYear().toString().substr(-2);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return year+month+date;
}

const displayFullDate = (s) => {
  const d = new Date('20'+s.substr(0,2),parseInt(s.substr(2,2))-1,s.substr(4,2));
  return d.toLocaleString('en-US', {year: 'numeric',month:'short',day:'numeric'});
}

const createCalendar = (d) => {
  let calendarList = [];
  
  // Create date on 1st of current month and year
  const currentMonth = new Date(d.getFullYear(),d.getMonth(),1);
  //currentMonth.setDate(1);
  const month = currentMonth.getMonth();

  // Roll back to the Sunday of the week
  while (currentMonth.getDay() !== 0) {
    currentMonth.setUTCDate(currentMonth.getUTCDate() - 1);
  }

  // Add days to list until next month is reached
  do {
    for (let i=0;i<7;i++) {
      // Add day to list
      calendarList.push(dateToStr(currentMonth));

      currentMonth.setUTCDate(currentMonth.getUTCDate() + 1);
    }
  } while (currentMonth.getMonth() === month);

  return calendarList;
}

const fetchFoodLists = async (keys) => {
  try {
    let obj = {};
    for (let i=0;i<keys.length;i++) {
      const value = await AsyncStorage.getItem('@'+keys[i]);
      if(value !== null) {
        obj[keys[i]] = JSON.parse(value);
      }
    }
    return obj;
  } catch(e) {
    // error reading value
  }
  return null;
}


const editFood = async (date, data, index) => {
  try {
    let dateObj = await AsyncStorage.getItem('@'+date);
    dateObj = dateObj != null ? JSON.parse(dateObj) : [];

    if (index === -1) {
      dateObj.push(data);
    } else {
      dateObj[index] = data;
    }

    await AsyncStorage.setItem('@'+date, JSON.stringify(dateObj));

    // Also change the state
    return dateObj;

  } catch(e) {
    console.log(e);
    // error reading value
  }
}

const removeFood = async (date, index) => {
  try {
    let dateObj = await AsyncStorage.getItem('@'+date);
    dateObj = dateObj != null ? JSON.parse(dateObj) : [];

    dateObj.splice(index, 1);

    await AsyncStorage.setItem('@'+date, JSON.stringify(dateObj));

    // Also change the state
    return dateObj;

  } catch(e) {
    console.log(e);
    // error reading value
  }
}

const App: () => Node = () => {

  // Today
  const today = new Date();

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  // List of days to display on calendar
  const [calendarList, setCalendarList] = useState(createCalendar(today));
  // Objs of lists of foods for each day
  const [foodLists, setFoodLists] = useState({});

  // Current selected month
  const d = new Date();
  d.setDate(1);
  const [selectedMonth, setSelectedMonth] = useState(d);
  // Current selected date
  const [selectedDate, setSelectedDate] = useState(dateToStr(today));
  // Current selected food
  const [foodIndex, setFoodIndex] = useState(-1);

  // Data to edit food item
  const [foodItem, onChangeFoodItem] = useState("");
  const [cals, onChangeCals] = useState("");
  const [qty, onChangeQty] = useState("1");
  const [eaten, onChangeEaten] = useState(false);

  // Fetch food lists if calendar changes
  useEffect(() => {
    fetchFoodLists(calendarList).then(value => {
      setFoodLists(value);
    });
  }, [calendarList]);

  function prefillModal(item,index) {
    onChangeFoodItem(item.n);
    onChangeCals(item.c);
    onChangeQty(item.q);
    onChangeEaten(item.e);
    setFoodIndex(index);
  }

  function resetModal() {
    onChangeFoodItem('');
    onChangeCals('');
    onChangeQty('1');
    onChangeEaten(false);
    setFoodIndex(-1);
  }

  function getTotal(d) {
    let total = 0;
    if (!foodLists[d]) return total;
    for (let i=0;i<foodLists[d].length;i++) {
      total += foodLists[d][i].q*foodLists[d][i].c;
    }
    return total;
  }

  function changeMonth(inc) {
    const m = new Date(selectedMonth.getFullYear(),selectedMonth.getMonth()+inc,1)
    setSelectedMonth(m);
    setCalendarList(createCalendar(m));
  }

  return (
    <View style={{backgroundColor: colors.light, flexDirection:'column',flex:1}}>
      <StatusBar
        barStyle={'dark-content'}
        backgroundColor={colors.light}
      />
      <View
        style={{backgroundColor: colors.light}}
      >
        <View style={{
          flexDirection: "row",
          marginLeft:3,
          marginRight:3,
          justifyContent:'center'
        }}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.dayButton}><FontAwesomeIcon style={{alignSelf:'center'}} icon={faChevronLeft} color={colors.arrow} size={28} /></Pressable>
          <Text style={styles.monthTitle}>{selectedMonth.toLocaleString('en-US', {year: 'numeric',month:'long'})}</Text>
          <Pressable onPress={() => changeMonth(1)} style={styles.dayButton}><FontAwesomeIcon style={{alignSelf:'center'}} icon={faChevronRight} color={colors.arrow} size={28} /></Pressable>
        </View>

        {calendarList.map((item,index) => {
          if (index % 7 == 0)
            return <View key={item} style={{
              flexDirection: "row",
              marginLeft:3,
              marginRight:3
            }}>
              {[0,1,2,3,4,5,6].map((item2,index2) => {
                let date = calendarList[index+index2];
                // selected, today, goal, unmarked
                let bg = colors.unmarked;
                const total = getTotal(date);
                if (date === selectedDate) {
                  bg = colors.selected;
                } else if (date === dateToStr(today)) {
                  bg = colors.today;
                } else if (total >= 1700 && total <= 2400) {
                  bg = colors.good;
                } else if (total > 2400 && total <= 3100) {
                  bg = colors.cheat;
                } else if (total > 3100) {
                  bg = colors.bad;
                }

                return <Pressable onPress={() => setSelectedDate(date)} key={item2} style={[styles.dayButton,{backgroundColor: bg}]}><Text style={[styles.dayNum,{color:selectedMonth.getMonth()+1 === parseInt(date.substr(2,2)) ? '#424242' : '#eeeeee'}]}>{date.substr(-2)}</Text></Pressable>
              })}
            </View>
          return null;
        })}
        <View style={{width:'100%',height:2,backgroundColor:'#dedede',marginTop:3,marginBottom:12}}/>
        <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6,marginLeft:'10%',marginRight:'20%'}}>
          <Text style={{fontSize:22,fontWeight:'bold'}}>{displayFullDate(selectedDate)}</Text>
          <Text style={{fontSize:22,fontWeight:'bold'}}>{getTotal(selectedDate)}</Text>
        </View>
      </View>

      <ScrollView
        style={{backgroundColor: colors.light,flex:1}}>
        <View
          style={{backgroundColor: colors.light}}>

          {(foodLists[selectedDate] || []).map((item,index) => {
            return <Pressable onPress={() => {prefillModal(item,index); setModalVisible(true)}} key={index} style={{flexDirection: "row",backgroundColor:colors.unmarked,padding:6,marginLeft:6,marginRight:6,marginTop:3,marginBottom:3,borderRadius:3,alignItems:'center'}}>
              <Text style={{flex:5,fontSize:16}}>{item.n+(item.q > 1 ? (' (x'+item.q+')') : '')}</Text>
              <Text style={{flex:1,textAlign:'right',marginRight:12,fontSize:16}}>{item.c*item.q}</Text>
              <Pressable 
                onPress={() => editFood(selectedDate,{...item, e:!item.e},index).then(value => setFoodLists({...foodLists, [selectedDate]: value}))}
                style={[styles.circleButton, {backgroundColor:item.e ? colors.eaten : colors.pending,marginRight:12}]}><FontAwesomeIcon style={styles.circleButtonIcon} icon={item.e ? faCheck : faClock} size={styles.circleButtonIcon.fontSize} /></Pressable>
              <Pressable 
                onPress={() => removeFood(selectedDate,index).then(value => {setFoodLists({...foodLists, [selectedDate]: value})})}
                style={[styles.circleButton, {backgroundColor:colors.grey,marginRight:6}]}><FontAwesomeIcon style={styles.circleButtonIcon} icon={faTrashCan} size={styles.circleButtonIcon.fontSize} /></Pressable>
            </Pressable>
          })}

          <Pressable
            onPress={() => {resetModal(); setModalVisible(true)}}
            style={[styles.circleButton,{backgroundColor:colors.pending,alignSelf:'center',margin:18}]}
          >
            <FontAwesomeIcon style={styles.circleButtonIcon} icon={faPlus} size={styles.circleButtonIcon.fontSize} />
          </Pressable>
          
        </View>
      </ScrollView>
      <FoodModal
            modalVisible={modalVisible}
            setModalVisible={setModalVisible}
            foodItem={foodItem}
            onChangeFoodItem={onChangeFoodItem}
            cals={cals}
            onChangeCals={onChangeCals}
            qty={qty}
            onChangeQty={onChangeQty}
            eaten={eaten}
            onChangeEaten={onChangeEaten}
            saveItem={() => editFood(selectedDate,{t:'f',n:foodItem,c:cals,q:qty,e:eaten},foodIndex).then(value => {setFoodLists({...foodLists, [selectedDate]: value}); setModalVisible(false)})}
          />
    </View>
  );
};

const colors = {
  unmarked: '#b2ebf2',
  selected: '#2196f3',
  today: '#9575cd',
  good: '#81c784',
  cheat: '#ffd54f',
  bad: '#f06292',
  nonMonth: '#eee',
  
  pending: '#ffc107',
  eaten: '#66bb6a',
  grey: '#90a4ae',
  arrow: '#607d8b',
  
  inputBorder:'#eaeaea',
  light:'#f3f3f3'
}

const styles = {
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    backgroundColor: colors.light,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width:'80%'
  },
  input: {
    backgroundColor:'#fff',
    borderRadius:6,
    borderColor:colors.inputBorder,
    borderWidth:1,
    fontSize:16,
    marginBottom:9,
    marginTop:9
  },
  dayButton: {
    flex: 1,
    borderRadius:3,
    aspectRatio:1,
    margin:3,
    justifyContent:'center'
  },
  dayNum: {
    textAlign:'center',
    fontSize:18,
    fontWeight:'bold'
  },
  monthTitle: {
    flex: 5,
    marginLeft:15,
    marginRight:15,
    marginTop:3,
    marginBottom:3,
    textAlign:'center',
    alignSelf:'center',
    fontSize:24,
    fontWeight:'bold'
  },
  circleButton: {
    flexShrink:1,
    borderRadius:50,
    height:30
  },
  circleButtonIcon: {
    margin:6,
    color:'white',
    fontSize:18
  }
};


export default App;
