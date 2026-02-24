import Form from "@/components/Form";

const Contact = () => {
  return (
    <div
      id="contact"
      className="
        flex
        h-fit w-full
        items-center justify-around
      "
    >
      <div className="flex flex-col w-1/3 gap-12">
        <h3 className="text-5xl font-bold">Send Me a Message!</h3>
        <p className="text-base md:text-xl">
          If you'd like to chat about anything business, social, nerdy etc,
          chuck me a message! :)
        </p>
      </div>
      <div className="w-1/3">
        <Form />
      </div>
    </div>
  );
};

export default Contact;
