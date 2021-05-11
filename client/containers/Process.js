import React, { Component } from 'react';
import Layout from '../components/Layout';
import Grid from '@material-ui/core/Grid';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Link } from 'react-router-dom';
import { init } from 'onfido-sdk-ui';
import api from '../utils/api';
import axios from 'axios';

import socketIOClient from 'socket.io-client';
import { HOST } from '../config/config';

const socket = socketIOClient(HOST);

class Process extends Component {
  constructor(props) {
    super(props);

    this.state = {
      is_expired: false,
      is_waiting: false,
    };
  }

  setWaiting = () => {
    this.setState({is_waiting: true});
  }
  
  send = () => {
    socket.emit('handle result', 'red') // change 'red' to this.state.color
  }

  componentDidMount() {
    let self = this;

    api.get(`/onfido-init/${this.props.match.params.token}`).then((res) => {
      console.log('init==============', res);
      if (res.data.error) {
        this.setState({ is_expired: true });
        return;
      }

      init({
        token: res.data.sdk_token,
        containerId: 'onfido-mount',
        steps: [
          {
            type: 'welcome',
            options: {
              title: 'Clear List',
              descriptions: [
                'ClearList requires our clients to register for a Trellis digital identification profile.',
                'This simple process will enable our clients to streamline private-market transactions in a secure manner.',
              ],
              nextButton: "LETS'S GET STARTED",
            },
          },
          'document',
          'face',
        ],
        onComplete: function (data) {
          api.get(`/onfido-check/${res.data.applicant_id}`).then((res) => {
            console.log('check=============', res);
            return self.setWaiting();
          });
        },
      });
    });
    
    socket.on('handle result', res => {
      if(typeof(res.type) !== 'undefined' && res.type === 'hook_response'){
        // console.log('webhook res=====', res);
        axios.get(res._r, {
          headers: {
            'Authorization': `Token token=${res._t}`,
            'Access-Control-Allow-Origin': HOST,
          }
        }).then(res => {
          console.log('result=============>', res);
        });
      }
    });

  }
  
  render() {
    const expiredBlock = (
      <Layout>
        <p>
          Your verification token was expired.
          <br />
          Please try again.
          <br />
        </p>
      </Layout>
    );

    const waitingBlock = (
      <Layout>
        <CircularProgress className="loader-circle" color="inherit" />
      </Layout>
    );

    const reviewBlock = (
      <Layout style={{ width: '100%' }}>
        <h5 style={{ textAlign: 'center' }}>Please Check for Accuracy</h5>
        <Grid container spacing={2} style={{ paddingTop: 10 }}>
          <Grid item md={6} xs={12}>
            <FormControl fullWidth>
              <TextField label="First Name*" />
            </FormControl>
          </Grid>
          <Grid item md={6} xs={12}>
            <FormControl fullWidth>
              <TextField label="Address 1*" />
            </FormControl>
          </Grid>
          <Grid item md={6} xs={12}>
            <FormControl fullWidth>
              <TextField label="Middle Name" />
            </FormControl>
          </Grid>
          <Grid item md={6} xs={12}>
            <FormControl fullWidth>
              <TextField label="Address 2" />
            </FormControl>
          </Grid>
          <Grid item md={6} xs={12}>
            <FormControl fullWidth>
              <TextField label="Last Name*" />
            </FormControl>
          </Grid>
          <Grid item md={6} xs={12}>
            <FormControl fullWidth>
              <TextField label="Address 3" />
            </FormControl>
          </Grid>
          <Grid item md={6} xs={12}>
            <FormControl fullWidth>
              <TextField label="DOB*" />
            </FormControl>
          </Grid>
          <Grid item md={6} xs={12}>
            <FormControl fullWidth>
              <TextField label="City*" />
            </FormControl>
          </Grid>
          <Grid item md={6} xs={12}>
            <FormControl fullWidth>
              <TextField label="Document #*" />
            </FormControl>
          </Grid>
          <Grid item md={3} xs={6}>
            <FormControl fullWidth>
              <TextField label="State*" />
            </FormControl>
          </Grid>
          <Grid item md={3} xs={6}>
            <FormControl fullWidth>
              <TextField label="Zip*" />
            </FormControl>
          </Grid>
        </Grid>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            className="btn-submit"
            variant="contained"
            color="primary"
            disableElevation
            size="large"
          >
            &nbsp;&nbsp;SUBMIT >&nbsp;&nbsp;
          </Button>
        </div>
      </Layout>
    );

    if (this.state.is_expired) {
      return expiredBlock;
    }
    if(this.state.is_waiting){
      return waitingBlock;
    }else{
      return <div id="onfido-mount"></div>
    }
  }
}

export default Process;
