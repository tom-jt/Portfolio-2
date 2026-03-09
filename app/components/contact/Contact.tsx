import Form from "@/components/Form";

const Contact = () => {
  return (
    <div
      id="contact"
      className="
        flex
        h-fit w-full max-sm:flex-col max-sm:gap-12
        justify-around gap-24
      "
    >
      <div className="flex flex-col gap-4 sm:w-1/2 2xl:w-1/3">
        <h3 className="max-sm:text-3xl text-5xl font-bold">The Yap Zone</h3>
        <p className="text-base 2xl:text-xl">
          If you'd like to chat about anything business, social, nerdy etc,
          chuck me a message! :)
        </p>
      </div>
      <div className="sm:w-1/2 2xl:w-1/3">
        <Form />
      </div>
    </div>
  );
};

export default Contact;
