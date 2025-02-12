import {
  DefaultButton,
  Dropdown,
  FontWeights,
  getTheme,
  IDropdownOption,
  mergeStyleSets,
  Modal,
  Persona,
  PersonaSize,
  PrimaryButton,
  Spinner,
  TextField,
} from "office-ui-fabric-react";
import * as React from "react";
import { RichText } from "@pnp/spfx-controls-react/lib/RichText";
import axios from "axios";
import { baseAPI } from "./EnvironmentVariables";

require("./custom.css");

const theme = getTheme();
const contentStyles = mergeStyleSets({
  container: {
    display: "flex",
    minWidth: "800px",
    maxWidth: "800px",
  },
  header: [
    theme.fonts.xLargePlus,
    {
      flex: "1 1 auto",
      borderTop: `4px solid #03787c`,
      color: theme.palette.neutralPrimary,
      display: "flex",
      alignItems: "center",
      fontWeight: FontWeights.semibold,
      padding: "12px 12px 14px 24px",
      background: "#53bf9d",
    },
  ],
  body: {
    flex: "4 4 auto",
    padding: "0 24px 24px 24px",
    overflowY: "hidden",
    selectors: {
      p: { margin: "14px 0" },
      "p:first-child": { marginTop: 0 },
      "p:last-child": { marginBottom: 0 },
    },
  },
});

const customStyles = mergeStyleSets({
  boldWhiteText: {
    fontWeight: FontWeights.bold,
    color: "white",
  },
});

interface IFlipModal {
  ModalOpen: boolean;
  ModalClose: any;
  KidDetail: any;
  Reply: any;
}

interface IFlipModalState {
  IsLoading: boolean;
  FlipTypeOption: IDropdownOption[];
  FlipTemplate: any[];
  selectedFlipType: string;
  Title: string;
  Message: string;
  imageFile: File | null;
}

export default class ReplyFlipModal extends React.Component<IFlipModal, IFlipModalState> {
  constructor(props: IFlipModal) {
    super(props);
    this.state = {
      IsLoading: false,
      FlipTypeOption: [],
      FlipTemplate: [],
      selectedFlipType: "",
      Title: "",
      Message: "",
      imageFile: null
    };
  }

  componentDidMount() {
    this.fetchFlipTypeData();
    this.fetchFlipTemplateData();
  }

  componentDidUpdate(prevProps: IFlipModal, prevState: IFlipModalState) {
    if (!this.props.Reply && 
        (prevState.selectedFlipType !== this.state.selectedFlipType || 
         prevProps.KidDetail.name !== this.props.KidDetail.name)) {
      const filteredFlipTemplate = this.state.FlipTemplate.filter(
        (item: any) => item.flipType === this.state.selectedFlipType
      );

      if (filteredFlipTemplate[0]) {
        const formattedMessage = filteredFlipTemplate[0].message.replace(
          "[Patient]",
          this.props.KidDetail.name
        );
        this.setState({
          Title: filteredFlipTemplate[0].title,
          Message: formattedMessage
        });
      }
    }
  }

  FlipTypeChoose = (event: any, option: any) => {
    this.setState({ selectedFlipType: option.key });
  };

  fetchFlipTypeData = async () => {
    try {
      const response = await axios.get(`${baseAPI()}/getFlipTypeList`);
      const filteredFlipTypeData = response.data.flipTypeList.filter(
        (item: any) => item.canCreate === "Care Partner"
      );
      const dropdownOptions: IDropdownOption[] = filteredFlipTypeData.map(
        (item: any) => ({
          key: item.flipType,
          text: item.flipType,
        })
      );
      this.setState({ FlipTypeOption: dropdownOptions });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  fetchFlipTemplateData = async () => {
    try {
      const response = await axios.get(`${baseAPI()}/getFlipTemplate`);
      this.setState({ FlipTemplate: response.data.templates });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  ModalClose = () => {
    this.props.ModalClose(false);
    this.setState({
      Message: "",
      Title: "",
      selectedFlipType: ""
    });
  };

  handleTitleChange = (event: any) => {
    this.setState({ Title: event.target.value });
  };

  onTextChange = (newText: string) => {
    this.setState({ Message: newText });
    return newText;
  };

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.setState({ imageFile: files[0] });
    }
  };

  GetUserName = async () => {
    const response = await axios.get("/_api/web/currentuser");
    return response.data.Email;
  };

  handleSendFlip = async () => {
    try {
      this.setState({ IsLoading: true });
      // const url = `${baseAPI()}/createflip`;
      const formData = new FormData();
      formData.append("Kid_Id", this.props.KidDetail.kid_Id);
      formData.append("Receiver_Id", this.props.KidDetail.parent_Id);
      formData.append("Parent_Id", this.props.KidDetail.parent_Id);
      formData.append("Flip_Type", this.state.selectedFlipType);
      formData.append("Title", this.state.Title);
      formData.append("Message", this.state.Message);
      if (this.state.imageFile) {
        formData.append("Image", this.state.imageFile, this.state.imageFile.name);
      } else {
        formData.append("Image", "");
      }
      formData.append("upload_by", await this.GetUserName());

      window.alert(`Flip sent successfully.`);
      this.setState({ IsLoading: false });
      this.ModalClose();
    } catch (error) {
      this.setState({ IsLoading: false });
      console.error(error);
      window.alert("Flip not sent !");
      throw error;
    }
  };

  render() {
    return (
      <Modal
        isOpen={this.props.ModalOpen}
        onDismiss={this.ModalClose}
        containerClassName={contentStyles.container}
      >
        <div className={contentStyles.header}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "98%",
            }}
          >
            <Persona
              imageUrl={this.props.KidDetail.photo}
              size={PersonaSize.size48}
              text={this.props.KidDetail.name}
              className={customStyles.boldWhiteText}
            />

            <Dropdown
              style={{ width: "200px" }}
              placeholder="Choose Flip Type"
              options={this.state.FlipTypeOption}
              onChange={this.FlipTypeChoose}
              selectedKey={this.state.selectedFlipType}
              disabled={this.props.Reply}
            />
          </div>
        </div>

        <div className={contentStyles.body}>
          <TextField
            label="Title"
            value={this.state.Title}
            onChange={this.handleTitleChange}
            styles={{ root: { marginBottom: 30, marginTop: 20 } }}
          />

          <RichText
            placeholder="Message"
            value={this.state.Message}
            onChange={this.onTextChange}
          />
          <div style={{ marginTop: "15px", marginBottom: "20px" }}>
            <input type="file" onChange={this.handleFileChange} />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "25%",
              marginTop: "30px",
            }}
          >
            <DefaultButton text="Cancel" onClick={this.ModalClose} />

            {!this.state.IsLoading ? (
              <div>
                <PrimaryButton onClick={this.handleSendFlip}>Send</PrimaryButton>
              </div>
            ) : (
              <div style={{ marginTop: "5px" }}>
                <Spinner
                  label="Sending..."
                  ariaLive="assertive"
                  labelPosition="right"
                />
              </div>
            )}
          </div>
        </div>
      </Modal>
    );
  }
}