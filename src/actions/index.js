import ethereum from '../middleware/ethereum'
import { getIdentities } from '../middleware/HealthChainRx'
import crypto from '../middleware/crypto'
import { RECEIVE_ACCOUNTS, SET_SELECTED_DOCTOR_ADDRESS, SET_SELECTED_PHARMA_ADDRESS } from '../reducers/accounts'
import { RECEIVE_CRYPTOS } from '../reducers/cryptos'
import { SELECT_CRYPTO, SELECT_FROM_ADDRESS, SELECT_TO_ADDRESS, ENTER_AMOUNT } from '../reducers/transfer'
import { SHOW_TRANSACTIONS, ADD_TRANSACTION, UPDATE_TRANSACTIONS } from '../reducers/transactions'
import { RECIEVE_IDENTITIES } from '../reducers/identities'
import { SHOW_PRESCRIPTION_QR } from '../reducers/prescription'
import { SHOW_SUCCESS, SHOW_ERROR, ACK_ERROR } from '../reducers/dispenser'
import { addPrescription, verifyPrescription, dispensePrescription } from '../middleware/HealthChainRx'

import Web3 from 'web3'

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
import { default as contract } from 'truffle-contract'
// Import our contract artifacts and turn them into usable abstractions.
import artifacts from '../../build/contracts/HealthChainRx.json'

var HealthChainRx = contract(artifacts);
HealthChainRx.setProvider(web3.currentProvider);

export const setSelectedDoctorAddress = address => ({
  type: SET_SELECTED_DOCTOR_ADDRESS,
  address,
})

export const setSelectedPharmaAddress = address => ({
  type: SET_SELECTED_PHARMA_ADDRESS,
  address,
})

const recieveIdentities = identities => ({
  type: RECIEVE_IDENTITIES,
  identities
})

export const getAllIdentities = () => (dispatch, getState) => {
  let identities = getIdentities().then(ids => {
    dispatch(recieveIdentities(ids))
  })

}

const showPrescriptionQR = prescription => ({
  type: SHOW_PRESCRIPTION_QR,
  prescription
})

export const addPrescriptionDispatcher = (dateIssued, expiresInDays, hash, qrCodeData, ) => (dispatch, getState) => {
  let storeState = getState();
  let docAddress = storeState.accounts.selected.selectedDoctorAddress;
  let success = addPrescription(dateIssued, expiresInDays, hash, docAddress)
  console.log(`success: ${success}`)
  if (success) {
    dispatch(showPrescriptionQR({dateIssued, expiresInDays, hash, qrCodeData}))
  } else {
    console.log(`error adding prescription`)
  }
}

const showSuccess = status => ({
  type: SHOW_SUCCESS,
  status
})

const showError = status => ({
  type: SHOW_ERROR,
  status
})

const ackError = () => ({
  type: ACK_ERROR
})

export const ackErrorDispatcher = () => (dispatch, getState) => {
  dispatch(ackError())
}

export const verifyPrescriptionDispatcher = (hash) => (dispatch, getState) => {
  verifyPrescription(hash).then((status) => {
    console.log('STATUS: ', status);
    if (status === "Good") {
      dispatch(showSuccess(status))
    } else {
      dispatch(showError(status))
    }
  })

}

export const dispenseDispatcher = (hash) => async (dispatch, getState) => {
  let storeState = getState();
  let pharmaAddress = storeState.accounts.selected.selectedPharmaAddress;
  let status = await verifyPrescription(hash)
  console.log('STATUS: ', status);
  if (status === "Good") {
    let txn = await dispensePrescription(hash, pharmaAddress)
    dispatch(addTransactionAction(txn))
  } else {
    dispatch(showError(status))
  }
}

const receiveAccounts = accounts => ({
  type: RECEIVE_ACCOUNTS,
  accounts: accounts
})

const setFromAddress = address => ({
  type: SELECT_FROM_ADDRESS,
  address
})

const setToAddress = address => ({
  type: SELECT_TO_ADDRESS,
  address
})

export const addTransactionAction = transaction => ({
  type: ADD_TRANSACTION,
  transaction
})

export const updateAllTransactions = data => ({
  type: UPDATE_TRANSACTIONS,
  data
})

export const showTransactions = transactions => ({
  type: SHOW_TRANSACTIONS,
  transactions
})

export const selectFromAddress = address => (dispatch, getState) => {
  dispatch(setFromAddress(address))
}

export const selectToAddress = address => (dispatch, getState) => {
  dispatch(setToAddress(address))
}

export const getAllAccounts = () => (dispatch, getState) => {
  ethereum.getAccounts(accounts => {
    dispatch(receiveAccounts(accounts))
  })
}

const setCrypto = id => ({
  type: SELECT_CRYPTO,
  crypto: id
})

export const selectCrypto = id => (dispatch, getState) => {
  dispatch(setCrypto(id))
}

const receiveSupportedCryptos = cryptos => ({
  type: RECEIVE_CRYPTOS,
  cryptos: cryptos
})

export const getCryptos = () => (dispatch, getState) => {
  crypto.getCryptos(cryptos => {
    dispatch(receiveSupportedCryptos(cryptos))
    if (typeof getState().transfer.detail.crypto === "undefined") {
      dispatch(setCrypto(cryptos[0]))
    }
  })
}

const setAmount = amount => ({
  type: ENTER_AMOUNT,
  amount
})

export const enterAmount = amount => (dispatch, getState) => {
    dispatch(setAmount(amount))
}

export const emitTransfer = () => (dispatch, getState) => {
  let txn = getState().transfer.detail
  let txnHash = ethereum.transfer(txn)
  console.log(`txnHash: ${txnHash}`)
}

export const watchTransactions = () => (dispatch, getState) => {
  let filter = web3.eth.filter('latest');
  return filter.watch(function(error, result) {
      if (error) {
        console.log(error)
      } else{
        var block = web3.eth.getBlock(result, true)
        let txns = getState().transactions
        for (var txn of block.transactions) {
          console.log('txn: ', txn);
          let receipt = web3.eth.getTransactionReceipt(txn.hash)
          console.log('receipt:', receipt)
          let idx = txns.findIndex((txn) => (txn && txn.hash && txn.hash == receipt.transactionHash));
          if(idx >= 0){
            // found
            let elem = txns[idx];

            elem.receipt  = receipt;
            txns[idx] = elem;
          }
          //debugger
          // let receipt = web3.eth.getTransactionReceipt(txn.hash)
          // dispatch(transactionMined(receipt))
        }
        dispatch(updateAllTransactions(txns))
      }
    }
  )

}

export const watchPrescriptions = () => async (dispatch, getState) => {
  let healthChainRx = await HealthChainRx.deployed()
  let event = healthChainRx.ShowHash()
  return event.watch((error, result) => {
    if (error) {
      console.log(error)
    } else {
      console.log(result)
      //dispatch(prescriptionAction(result))
    }
  })
}

export const RESET_ERROR_MESSAGE = 'RESET_ERROR_MESSAGE';

// Resets the currently visible error message
export const resetErrorMessage = () => ({
  type: RESET_ERROR_MESSAGE
})
