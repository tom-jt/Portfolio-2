import styles from "./ScrollDownIndicator.module.css";

const ScrollDownIndicator = () => {
  return (
    <div className="relative">
      <a
        className={`border-foreground/80 absolute top-0 left-1/2 -ml-3 h-6 w-6 border-b-2 border-l-2 ${styles.scrollDownIndicator}`}
      ></a>
    </div>
  );
};

export default ScrollDownIndicator;
