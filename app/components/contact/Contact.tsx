import Form from "@/components/Form";
import SectionTitle from "@/components/SectionTitle";

const Contact = () => {
  return (
    <div
      id="contact"
      className="
        flex
        h-fit w-full max-sm:flex-col max-sm:gap-10
        justify-around gap-16 sm:gap-24
      "
    >
      <div className="flex flex-col gap-4 sm:w-1/2 2xl:w-1/3 max-sm:items-center sm:items-start">
        <SectionTitle
          eyebrow="Contact"
          title="The Yap Zone"
          as="h2"
          align="start"
          className="max-sm:items-center max-sm:[&_.c-h1]:text-center max-sm:[&_.c-eyebrow]:text-center"
        />
        <p className="text-base text-zinc-600 dark:text-zinc-300 2xl:text-xl max-sm:text-center">
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
