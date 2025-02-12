import * as React from "react";
import { IKidDetailListProps } from "./IKidDetailListProps";
import DataTable from "./KidDataComponent";
import styles from './KidDetailList.module.scss';
import TodaysAppointmentList from "./TodaysAppointmentList";
import { KidProvider } from "./context/kidcontext";
import { SPComponentLoader } from "@microsoft/sp-loader";

// Load Bootstrap 3.3.7
SPComponentLoader.loadCss(
  "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
);

// Inject custom styles to remove padding and margin
const style = document.createElement("style");
style.innerHTML = `
  .container-fluid, .row {
    padding-left: 0 !important;
    padding-right: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
`;
document.head.appendChild(style);

class KidDetailList extends React.Component<IKidDetailListProps> {
  componentDidMount() {
    this.setupLayout();
    window.addEventListener('resize', this.setupLayout);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setupLayout);
  }

  setupLayout = () => {
    // Target specific SharePoint canvas elements
    const canvasZone = document.querySelector(".CanvasZone");
    const canvasSection = document.querySelector(".CanvasSection");
    const canvasZoneContainer = document.querySelector(".CanvasZoneContainer");

    if (canvasZone) {
      canvasZone.setAttribute('style', 'padding: 0 !important; padding-left: 0 !important; margin: 0 !important; width: 100% !important; left: 0 !important;');
    }

    if (canvasSection) {
      canvasSection.setAttribute('style', 'padding: 0 !important; padding-left: 0 !important; margin: 0 !important; width: 100% !important; left: 0 !important;');
    }

    if (canvasZoneContainer) {
      canvasZoneContainer.setAttribute('style', 'max-width: none !important; padding: 0 !important; padding-left: 0 !important; margin: 0 !important; left: 0 !important;');
    }

    // Remove data-offset values
    const spFreCanvas = document.querySelectorAll("[data-sp-fre-id]");
    spFreCanvas.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.left = '0';
        element.style.margin = '0';
        element.style.marginLeft = '0';  
        element.style.padding = '0';
        element.style.paddingLeft = '0';  // Explicitly setting padding-left to 0
        element.removeAttribute('data-offset-left');
        element.removeAttribute('data-offset-top');
      }
    });
  };

  render() {
    return (
      <KidProvider>
        <div className={`${styles.kidDetailContainer} TableMain container-fluid`} style={{ paddingLeft: 0 }}>
          <div className="row" style={{ paddingLeft: 0, marginLeft: 0 }}>
            {/* Bootstrap 3 uses col-xs/sm/md/lg instead of just col-md */}
            <div className="col-sm-8"> {/* 2/3 width */}
              <div className={styles.tableWrapper}>
                <DataTable />
              </div>
            </div>
            <div className="col-sm-4"> {/* 1/3 width */}
              <div className={styles.appointmentWrapper}>
                <TodaysAppointmentList />
              </div>
            </div>
          </div>
        </div>
      </KidProvider>
    );
  }
}

export default KidDetailList;
