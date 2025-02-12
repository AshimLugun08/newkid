import * as React from "react";
import {
  DefaultButton,
  PrimaryButton,
} from "office-ui-fabric-react/lib/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { Box, TextField } from "@mui/material";
import axios from "axios";
import { VscAdd } from "react-icons/vsc";
import { Spinner } from "office-ui-fabric-react";

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

interface IAddGrowthModalProps {
  modal?: boolean;
  modalClose: (value: boolean) => void;
  KidID: string;
  AppointmentID: string;
}

interface IAddGrowthModalState {
  open: boolean;
  loading: boolean;
  weight: string;
  height: string;
  headCircumference: string;
}

export default class AddGrowthModal extends React.Component<IAddGrowthModalProps, IAddGrowthModalState> {
  constructor(props: IAddGrowthModalProps) {
    super(props);
    this.state = {
      open: false,
      loading: false,
      weight: "",
      height: "",
      headCircumference: "",
    };
  }

  private handleOpen = () => {
    this.setState({ open: true });
  };

  private handleClose = () => {
    this.setState({ open: false });
  };

  private CancelButton = () => {
    this.handleClose();
    this.props.modalClose(false);
  };

  private GetUserName = async () => {
    const response = await axios.get("/_api/web/currentuser");
    const userTitle = response.data.Email;
    return userTitle;
  };

  private handleClick = async () => {
    const { weight, height, headCircumference } = this.state;

    // Check if at least one field has a value
    if (!weight && !height && !headCircumference) {
      window.alert("Enter at least one value.");
      return;
    }

    this.setState({ loading: true });
    const loggeduser = await this.GetUserName();

    try {
      const imageResponse = await fetch(require("../assets/growth.png"));
      const imageBlob = await imageResponse.blob();

      const formData = new FormData();
      formData.append("Kid_Id", this.props.KidID);
      formData.append("Height", height ? height : "0");
      formData.append("Weight", weight ? weight : "0");
      formData.append(
        "Head_Circumference",
        headCircumference ? headCircumference : "0"
      );
      formData.append("Image", imageBlob, "images.png");
      formData.append("Appointment_Related", "true");
      formData.append("Appointment_Id", this.props.AppointmentID);
      formData.append("upload_by", loggeduser);

      this.handleClose();
      this.CancelButton();
      this.setState({ loading: false });
      window.alert("Growth details added !");
    } catch (error) {
      console.error(error);
      this.handleClose();
      this.setState({ loading: false });
      window.alert("Error in update !");
      throw error;
    }
  };

  render() {
    const { open, loading } = this.state;
    const { modal } = this.props;

    return (
      <div>
        {!modal && (
          <PrimaryButton
            onClick={this.handleOpen}
            style={{
              marginLeft: "10.3125em",
              marginBottom: "1em",
              backgroundColor: "#337ab7",
              border: "none",
            }}
          >
            {" "}
            <VscAdd /> Add Growth Details
          </PrimaryButton>
        )}
        <div>
          <Modal
            open={modal || open}
            onClose={this.handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={style}>
              <Typography
                id="modal-modal-title"
                variant="h6"
                component="h2"
                sx={{ textAlign: "center" }}
              >
                Add Growth Details
              </Typography>

              <Typography
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: "20px",
                }}
              >
                <TextField
                  onChange={(event) => this.setState({ weight: event.target.value })}
                  id="standard-basic"
                  label="Weight (Kg)"
                  variant="standard"
                  InputProps={{
                    sx: { fontSize: "13px" },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: "13px",
                    },
                  }}
                />
              </Typography>

              <Typography
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: "20px",
                }}
              >
                <TextField
                  onChange={(event) => this.setState({ height: event.target.value })}
                  id="standard-basic"
                  label="Height (Cm)"
                  variant="standard"
                  InputProps={{
                    sx: { fontSize: "13px" },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: "13px",
                    },
                  }}
                />
              </Typography>

              <Typography
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: "20px",
                }}
              >
                <TextField
                  onChange={(event) => this.setState({ headCircumference: event.target.value })}
                  id="standard-basic"
                  label="Head Circ. (Cm)"
                  variant="standard"
                  InputProps={{
                    sx: { fontSize: "13px" },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: "13px",
                    },
                  }}
                />
              </Typography>
              <Typography
                sx={{
                  marginTop: "10px",
                  textAlign: "right",
                  justifyItems: "right",
                }}
              >
                <div
                  style={{
                    marginTop: "20px",
                    marginLeft: "145px",
                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <div
                    style={{
                      justifyContent: "right",
                      textAlign: "right",
                      marginLeft: "-23px",
                      marginRight: "10px",
                    }}
                  >
                    <DefaultButton onClick={this.CancelButton}>Close</DefaultButton>
                  </div>
                  {!loading ? (
                    <div style={{ marginRight: "10px" }}>
                      <PrimaryButton onClick={this.handleClick}>Save</PrimaryButton>
                    </div>
                  ) : (
                    <div style={{ marginTop: "5px", marginRight: "10px" }}>
                      <Spinner ariaLive="assertive" labelPosition="right" />
                    </div>
                  )}
                </div>
              </Typography>
            </Box>
          </Modal>
        </div>
      </div>
    );
  }
}