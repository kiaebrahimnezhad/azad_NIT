import styles from "./LoadingInformaition.module.css";

function LoadingInformaition(){
    return(
        <div className="text-center py-20">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-indigo-200 rounded-full"></div>
              <div className="absolute w-16 h-16 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="text-gray-600 mt-6 text-lg">
              در حال بارگذاری اطلاعات...
            </p>
            <div className="flex justify-center mt-4 space-x-1 space-x-reverse">
              <div className={`w-2 h-2 bg-indigo-500 rounded-full ${styles.pulseAnimation}`}></div>
              <div
                className={`w-2 h-2 bg-indigo-500 rounded-full ${styles.pulseAnimation}`}
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className={`w-2 h-2 bg-indigo-500 rounded-full ${styles.pulseAnimation}`}
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
        </div>
    )
}

export default LoadingInformaition;