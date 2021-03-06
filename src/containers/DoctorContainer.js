import React from 'react'
import { connect } from 'react-redux'
import { getAllAccounts } from '../reducers/accounts'
import AddressDropdown from '../components/AddressDropdown'
import { selectFromAddress,  getAllIdentities, addPrescriptionDispatcher, setSelectedDoctorAddress } from '../actions'
import sha256_wrapper from '../crypto';
var pd = require('probability-distributions');
var QRCode = require('qrcode-svg');
import DrugList from '../assets/DrugList';
//import QrReader from 'react-qr-reader'
var checkmarkImage = require('../img/featherPen.jpg');

import { Router, Route, browserHistory } from 'react-router'


const $ = window.$;

/* Fields
- Name - text
- DoB - datepicker
- Healthcard
- Notes textarea
- Drug details (dropdown)
- Notes
Prescribe button

QR Code (with print and/or send (via sms or email))
*/


class DoctorContainer extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      delay: 100,
    }
  }

  render(){

    let {accounts, identities, getAllIdentities} = this.props;

    console.log('accounts: ', accounts);

    const previewStyle = {
      height: 240,
      width: 320,
    }

    const buttonStyle = {
      height: "40px",
      lineHeight: "20px",
      fontSize: "20px",
      background: "#FFFFFF",
      marginRight: "12px",
      padding: "5px",
      borderRadius: "6px",
      border: "2px solid #888",
      fontFace: "Roboto, sans-serif",
      color: "#000",
    }

    let doctorArray = accounts.filter(el => {
      return el.category == 'doc'
    })


    console.log("DOC ARRAY")
    console.log(doctorArray)

    return (
        <div className="container">
          <div className="row">
            <div className="panel panel-primary">
              <div className="panel-heading">
                <h3>Doctor</h3>
                <div className="form-group">
                  <label for="doctor-input">Doctor</label>

                  <select className="form-control"
                          ref={(c) => {this.doctorInput = c;}}
                          onChange={(...args) => this.selectIdentity(...args)}>
                    <option data-key={null}>Select Doctor</option>
                    {doctorArray.map((account) => {
                      return (
                          <option data-key={account.address}>{account.name}</option>
                      )
                    })}
                  </select>

                  {/*
                <AddressDropdown id="doctor-input"
                  accounts={accounts} />
                  */}

                </div>
              </div>
            </div>
            <div className="panel-body">
              <div className="row">
                <div className="col-sm-6">

                  <form>
                    <div className="form-group">
                      <label htmlFor="patient-name-input">Name</label>
                      <input type="text"
                             ref={(c) => {this.nameInput = c;}}
                             value="Dave"
                             className="form-control"
                             id="patient-name-input"
                             placeholder="Name"/>
                    </div>

                    <div className="form-group">
                      <label htmlFor="patient-dob-input">Date of Birth</label>
                      <input type="text"
                             ref={(c) => {this.dobInput = c;}}
                             value="04/23/2017"
                             className="form-control"
                             id="patient-dob-input"
                             placeholder="Date of Birth"/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="patient-healthcard-input">Health Card #</label>
                      <input type="text"
                             ref={(c) => {this.healthCardInput = c;}}
                             value="123"
                             className="form-control"
                             id="patient-healthcard-input"
                             placeholder="HealthCard #"/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="patient-prescription-input">Prescription</label>
                      <input type="text"
                             ref={(c) => {this.prescriptionInput = c;}}
                             className="form-control"
                             id="patient-prescription-input"
                             placeholder="Prescription"/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="patient-prescription-instructions-input">Instructions</label>
                      <textarea type="text"
                             ref={(c) => {this.instructionsInput = c;}}
                             value="Take 3x daily with rum before coding"
                             className="form-control"
                             id="patient-prescription-instructions-input"
                             placeholder="Instructions">

                      </textarea>
                    </div>
                    <div className="checkbox">
                      <label>
                        <input type="checkbox"
                               ref={(c) => {this.sendSmsCheckbox = c;}}
                               id="send-sms-checkbox"
                               defaultChecked={true}/> Send SMS
                      </label>
                    </div>
                    <div className="checkbox">
                      <label>
                        <input type="checkbox"
                               ref={(c) => {this.printCheckbox = c;}}
                               id="print-checkbox"
                               defaultChecked={true}/> Print
                      </label>
                    </div>
                    <button type="submit"
                            onClick={(...args) => this.onClickPrescribe(...args)}
                            className="btn btn-success"
                            style={buttonStyle}
                    >
                      Prescribe{' '}
                      <img src={checkmarkImage} style={{height: "24px"}} />
                    </button>
                  </form>

                </div>
              </div>
            </div>
          </div>


          <div className="row" ref={(c) => {this.qrCodeContainer = c;}}>

          </div>

        </div>
    )
  }

  onClickPrescribe(evt, two){
    evt.stopPropagation();
    evt.preventDefault();

    let formValues = {
      name: this.nameInput.value,
      dob: this.dobInput.value,
      healthCard: this.healthCardInput.value,
      prescription: this.prescriptionInput.value,
      instructions: this.instructionsInput.value,
      //sendSmsCheckbox: this.sendSmsCheckbox.checked,
      //printCheckbox: this.printCheckbox.checked,
    };

    let encoded = JSON.stringify(formValues);
    let nonce = pd.prng(32);
    encoded += nonce;

    sha256_wrapper(encoded, (hash) => {
      console.log('sha256 hash DOCTOR: ', hash);
      let dateIssued = new Date().getTime()
      let expiresInDays = 20
      //this.props.addPrescriptionDispatcher(dateIssued, expiresInDays, hash);

      let qrCodeDataObj = {
        n: nonce,
        p: formValues.prescription,
        i: formValues.instructions,
      }

      let qrCodeData = JSON.stringify(qrCodeDataObj);
      //let qrCodeData = hash + delimiter + formValues.prescription + delimiter + formValues.instructions + delimiter;


      this.props.addPrescriptionDispatcher(dateIssued, expiresInDays, hash, qrCodeData);


      //var qrcode = new QRCode(qrCodeData);
      //var svg = qrcode.svg();
      //this.qrCodeContainer.innerHTML = svg;
      //document.getElementById("container").innerHTML = svg;

      browserHistory.push('/prescription');
    })
  }

  selectIdentity(){
    console.log('selectIdentity()');
    let elem = this.doctorInput;
    let selectedOption = elem.options[elem.selectedIndex];
    let key = selectedOption.getAttribute("data-key");
    if(key && key.length){
      this.props.setSelectedDoctorAddress(key);
    }
  }

  componentDidMount(){
    var $datePicker = $("#patient-dob-input").datetimepicker({
      format: 'MM/DD/YYYY',
    });
    var $input = $("#patient-prescription-input");
    $input.typeahead({
      source: DrugList,
      autoSelect: true
    });
    $input.change(function() {
      var current = $input.typeahead("getActive");
      if (current) {
        // Some item from your model is active!
        if (current.name == $input.val()) {
          // This means the exact match is found. Use toLowerCase() if you want case insensitive match.
        } else {
          // This means it is only a partial match, you can either add a new item
          // or take the active if you don't want new items
        }
      } else {
        // Nothing is active so it is a new value (or maybe empty value)
      }
    });
  }
}

const mapStateToProps = state => ({
  accounts: getAllAccounts(state.accounts),
  identities: state.identities
})

export default connect(
  mapStateToProps,
  { getAllIdentities, addPrescriptionDispatcher, setSelectedDoctorAddress }
)(DoctorContainer)
